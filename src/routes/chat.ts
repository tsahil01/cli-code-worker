import { Router } from "express";
import { anthropicChatStream } from "../sdk/antropic";
import { geminiChatStream } from "../sdk/gemini";
import { AnthropicInput, chatValidation, GeminiInput, ModelCapabilities, OpenAIInput, planSchema, UserData } from "../types";
import { verifyUser } from "../lib/auth";
import { anthropicModels, geminiModels, openaiModels, otherModels } from "../lib/models";
import { openAIChatCompletionStream } from "../sdk/openai";
import { ChatCompletionMessageParam } from "openai/resources/index";

const router = Router();

router.post("/stream", async (req, res) => {
    try {
        const zodValidation = chatValidation.safeParse(req.body)
        if (!zodValidation.success) {
            res.status(400).json({ error: "zod_validation_error", details: zodValidation.error.message })
            return;
        }
        const { chat } = zodValidation.data;
        const { messages, sdk, model, temperature, plan, apiKey, provider } = chat;

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


        if (sdk === "anthropic") {
            let modelCapabilities;
            if (provider != "anthropic") {
                modelCapabilities = otherModels.find((m: ModelCapabilities) => m.modelName === model && m.provider === provider && m.sdk === "anthropic");
            } else {
                modelCapabilities = anthropicModels.find((m: ModelCapabilities) => m.modelName === model && m.provider === provider);
            }
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
                    modelCapabilities.baseUrl,
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

        } else if (sdk === "gemini") {
            let modelCapabilities;
            if (provider === "other") {
                modelCapabilities = otherModels.find((m: ModelCapabilities) => m.modelName === model && m.provider === provider && m.sdk === "gemini");
            } else {
                modelCapabilities = geminiModels.find((m: ModelCapabilities) => m.modelName === model && m.provider === provider);
            }
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
        } else if (sdk === "openai") {
            let modelCapabilities;
            if (provider != "openai") {
                modelCapabilities = otherModels.find((m: ModelCapabilities) => m.modelName === model && m.provider === provider && m.sdk === "openai");
            } else {
                modelCapabilities = openaiModels.find((m: ModelCapabilities) => m.modelName === model && m.provider === provider);
            }
            if (!modelCapabilities) {
                res.write(`data: ${JSON.stringify({ error: "model_not_found", details: "Model not found" })}\n\n`);
                res.end();
                return;
            }
            const msgs: ChatCompletionMessageParam[] = parsedMsgs.map((msg) => {
                if (msg.role === "assistant" && msg.content.length > 0) {
                    return {
                        role: "assistant",
                        content: msg.content as string,
                    } as ChatCompletionMessageParam;
                } else if (msg.role === "assistant" && msg.content.length === 0 && msg.metadata?.toolCalls?.length) {
                    return {
                        role: "assistant",
                        content: `Running tool with id: ${msg.metadata.toolCalls[0].id}`,
                    } as ChatCompletionMessageParam;
                } else if (msg.role === "assistant" && msg.content.length === 0 && msg.metadata?.thinkingContent && msg.metadata?.thinkingContent.trim().length > 0) {
                    return {
                        role: "assistant",
                        content: msg.metadata.thinkingContent,
                    } as ChatCompletionMessageParam;
                } else if (msg.role === "user" && msg.metadata?.toolCalls?.length) {
                    return {
                        role: "user",
                        content: `Result of tool ${msg.metadata.toolCalls[0].id}: \n${msg.content}`,
                    } as ChatCompletionMessageParam;
                } else {
                    return {
                        role: "user",
                        content: msg.content as string,
                    } as ChatCompletionMessageParam;
                }
            });

            try {
                await openAIChatCompletionStream(
                    msgs,
                    modelCapabilities.modelName,
                    modelCapabilities.maxOutputTokens,
                    modelCapabilities.thinking,
                    plan,
                    apiKey,
                    modelCapabilities.baseUrl,
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

export default router;