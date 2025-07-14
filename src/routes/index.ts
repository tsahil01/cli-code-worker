import { Router } from "express";
import { AnthropicInput, chatValidation, GeminiInput, OpenAIInput, planSchema, UserData } from "../types";
import { verifyUser } from "../lib/auth";
import { anthropicModels, openaiModels, geminiModels, otherModels } from "../lib/models";
import { anthropicChatStream } from "../proviers/antropic";
import { geminiChatStream } from "../proviers/gemini";
import { openaiChatStream } from "../proviers/openai";
import { z } from "zod";

const router = Router();

router.get("/", (req, res) => {
    res.send("Hello World");
});

router.get("/models", async (req, res) => {
    const models = {
        anthropic: anthropicModels,
        openai: openaiModels,
        gemini: geminiModels,
        other: otherModels
    }
    res.status(200).json({ models });
});

router.post("/chat/stream", async (req, res) => {
    try {
        const zodValidation = chatValidation.safeParse(req.body)
        if (!zodValidation.success) {
            res.status(400).json({ error: "zod_validation_error", details: zodValidation.error.message })
            return;
        }
        const { chat } = zodValidation.data;
        const { messages, provider, base_url, model, temperature, max_tokens, plan, apiKey } = chat;


        const userData = await verifyUser(req, res);

        let parsedMsgs = messages.filter(msg => !msg.ignoreInLLM);

        if (!userData) {
            return;
        }

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control'
        });


        if (provider === "anthropic") {
            const modelCapabilities = anthropicModels.find((m) => m.modelName === model);
            if (!modelCapabilities) {
                res.write(`data: ${JSON.stringify({ error: "model_not_found", details: "Model not found" })}\n\n`);
                res.end();
                return;
            }
            const msgs: AnthropicInput[] = parsedMsgs.map((msg) => {
                if (msg.role === "assistant") {
                    const blocks: any[] = [];

                    if (modelCapabilities?.thinking && msg.metadata?.thinkingContent && msg.metadata?.thinkingContent.trim().length > 0) {
                        blocks.push({
                            type: "thinking",
                            thinking: msg.metadata?.thinkingContent || "",
                            signature: msg.metadata?.thinkingSignature || "",
                        });
                    }

                    if (msg.content && typeof msg.content === "string" && msg.content.trim().length > 0) {
                        blocks.push({
                            type: "text",
                            text: msg.content,
                        });
                    }
                    if (msg.metadata?.toolCalls?.length) {
                        blocks.push(
                            ...msg.metadata.toolCalls.map((toolCall) => ({
                                type: "tool_use",
                                id: toolCall.id,
                                name: toolCall.name,
                                input: toolCall.input,
                            }))
                        );
                    }

                    return {
                        role: "assistant",
                        content: blocks,
                    } as AnthropicInput;
                } else {
                    if (msg.metadata?.toolCalls?.length) {
                        return {
                            role: "user",
                            content: [
                                {
                                    type: "tool_result",
                                    tool_use_id: msg.metadata.toolCalls[0].id,
                                    content: msg.content as string,
                                },
                            ],
                        } as AnthropicInput;
                    }
                    return {
                        role: "user",
                        content: msg.content as string,
                    } as AnthropicInput;
                }
            });

            try {
                await anthropicChatStream(
                    msgs,
                    modelCapabilities.modelName,
                    modelCapabilities.maxOutputTokens,
                    modelCapabilities.thinking,
                    plan,   
                    apiKey,
                    (event) => {
                        res.write(`${JSON.stringify(event)}\n`);

                        if (event.type === 'final') {
                            res.write(`{"type":"done"}\n`);
                            res.end();
                        }
                    }
                );

            } catch (error) {
                res.write(`data: ${JSON.stringify({ error: "stream_error", details: error })}\n\n`);
                res.end();
            }

        } else if (provider === "gemini") {
            const modelCapabilities = geminiModels.find((m) => m.modelName === model);
            if (!modelCapabilities) {
                res.write(`data: ${JSON.stringify({ error: "model_not_found", details: "Model not found" })}\n\n`);
                res.end();
                return;
            }
            const msgs: GeminiInput[] = parsedMsgs.map((msg) => {
                if (msg.role === "assistant" && msg.metadata?.toolCalls?.length) {
                    return {
                        role: "assistant",
                        parts: [{
                            functionCall: {
                                name: msg.metadata.toolCalls[0].name,
                                args: msg.metadata.toolCalls[0].input,
                            }
                        }],
                        thoughtSignature: msg.metadata?.thinkingSignature || "",
                    } as GeminiInput;
                } else if (msg.role === "assistant" && !msg.metadata?.toolCalls?.length && msg.metadata?.thinkingContent && msg.metadata?.thinkingContent.trim().length > 0) {
                    return {
                        role: "assistant",
                        parts: [{
                            text: msg.metadata.thinkingContent,
                        }],
                        thoughtSignature: msg.metadata?.thinkingSignature || "",
                    } as GeminiInput;
                } else if (msg.role === "user" && msg.metadata?.toolCalls?.length) {
                    return {
                        role: "user",
                        parts: [{
                            functionResponse: {
                                name: msg.metadata.toolCalls[0].name,
                                response: { data: (msg.content as string) },
                            }
                        }],
                        thoughtSignature: msg.metadata?.thinkingSignature || "",
                    } as GeminiInput;
                } else {
                    return {
                        role: "user",
                        parts: [{ text: msg.content }],
                    } as GeminiInput;
                }
            });

            try {
                await geminiChatStream(
                    msgs,
                    modelCapabilities.modelName,
                    modelCapabilities.maxOutputTokens,
                    modelCapabilities.thinking,
                    plan,
                    apiKey,
                    (event) => {
                        res.write(`${JSON.stringify(event)}\n`);

                        if (event.type === 'final') {
                            res.write(`{"type":"done"}\n`);
                            res.end();
                        }
                    }
                );

            } catch (error) {
                res.write(`data: ${JSON.stringify({ error: "stream_error", details: error })}\n\n`);
                res.end();
            }
        } else {
            res.write(`data: ${JSON.stringify({ error: "provider_not_supported", details: "Provider not supported" })}\n\n`);
            res.end();
        }

    } catch (error) {
        console.error("Error in /chat/stream endpoint:", error);
        res.write(`data: ${JSON.stringify({ error: "internal_server_error", details: error })}\n\n`);
        res.end();
    }
});

router.get("/user", async (req, res) => {
    try {
        const userData = await verifyUser(req, res);;
        if (!userData) {
            return;
        }

        res.status(200).json(userData);
    } catch (error) {
        console.error("Error in /user endpoint:", error);
        res.status(500).json({ error: "internal_server_error", details: error });
    }
});

export default router;