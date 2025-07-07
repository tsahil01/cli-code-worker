import { Router } from "express";
import { AnthropicInput, chatValidation, GeminiInput, OpenAIInput, UserData } from "../types";
import { verifyUser } from "../lib/auth";
import { anthropicModels, openaiModels, geminiModels, otherModels } from "../lib/models";
import { anthropicChat, anthropicChatStream } from "../proviers/antropic";
import { geminiChat, geminiChatStream } from "../proviers/gemini";
import { openaiChat, openaiChatStream } from "../proviers/openai";

const router = Router();

router.get("/", (req, res) => {
    res.send("Hello World");
});

router.get("/models", async (req, res) => {
    const models = [...anthropicModels, ...openaiModels, ...geminiModels, ...otherModels];
    res.status(200).json({ models });
});

router.post("/chat", async (req, res) => {
    try {
        const zodValidation = chatValidation.safeParse(req.body)
        if (!zodValidation.success) {
            res.status(400).json({ error: "zod_validation_error", details: zodValidation.error.message })
            return;
        }
        const { chat } = zodValidation.data;
        const { messages, provider, base_url, model, temperature, max_tokens } = chat;

        const userData = await verifyUser(req, res);
        if (!userData) {
            return;
        }

        if (provider === "anthropic") {
            const msgs: AnthropicInput[] = messages.map((msg) => ({
                role: msg.role,
                content: [{
                    type: "text",
                    text: msg.content,
                }],
            }));

            const modelCapabilities = anthropicModels.find((m) => m.modelName === model);
            if (!modelCapabilities) {
                res.status(400).json({ error: "model_not_found", details: "Model not found" })
                return;
            }

            const response = await anthropicChat(msgs, modelCapabilities.modelName, modelCapabilities.maxOutputTokens, modelCapabilities.thinking);

            res.status(200).json({
                message: response.content,
                thinking: response.getThinking(),
                hasThinking: response.hasThinking(),
                toolCalls: response.toolCalls,
                finishReason: response.finishReason,
                usageMetadata: response.usageMetadata,
            })

        } else if (provider === "gemini") {
            const msgs: GeminiInput[] = messages.map((msg) => ({
                role: msg.role,
                parts: [{ text: msg.content }],
            }));

            const modelCapabilities = geminiModels.find((m) => m.modelName === model);
            if (!modelCapabilities) {
                res.status(400).json({ error: "model_not_found", details: "Model not found" })
                return;
            }

            const response = await geminiChat(msgs, modelCapabilities.modelName, modelCapabilities.maxOutputTokens, false);

            res.status(200).json({
                message: response.content,
                thinking: response.getThinking,
                hasThinking: response.hasThinking,
                toolCalls: response.toolCalls,
                finishReason: response.finishReason,
                usageMetadata: response.usageMetadata,
            })

        } else if (provider === "openai") {
            const msgs: OpenAIInput[] = messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
            }));

            const modelCapabilities = openaiModels.find((m) => m.modelName === model);
            if (!modelCapabilities) {
                res.status(400).json({ error: "model_not_found", details: "Model not found" })
                return;
            }

            const response = await openaiChat(msgs, modelCapabilities.modelName, modelCapabilities.maxOutputTokens, modelCapabilities.thinking, base_url);

            res.status(200).json({
                message: response.content,
                thinking: response.getThinking(),
                hasThinking: response.hasThinking(),
                toolCalls: response.toolCalls,
                finishReason: response.finishReason,
                usageMetadata: response.usageMetadata,
            })
        } else if (provider === "other") {
            const msgs: OpenAIInput[] = messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
            }));

            const modelCapabilities = otherModels.find((m) => m.modelName === model);
            if (!modelCapabilities) {
                res.status(400).json({ error: "model_not_found", details: "Model not found" })
                return;
            }

            const response = await openaiChat(msgs, modelCapabilities.modelName, modelCapabilities.maxOutputTokens, modelCapabilities.thinking, base_url);

            res.status(200).json({
                message: response.content,
                thinking: response.getThinking(),
                hasThinking: response.hasThinking(),
                toolCalls: response.toolCalls,
                finishReason: response.finishReason,
                usageMetadata: response.usageMetadata,
            })
        } else {
            res.status(400).json({ error: "provider_not_supported", details: "Provider not supported" })
        }


    } catch (error) {
        console.error("Error in /chat endpoint:", error);
        res.status(500).json({ error: "internal_server_error", details: error })
    }
});

router.post("/chat/stream", async (req, res) => {
    try {
        const zodValidation = chatValidation.safeParse(req.body)
        if (!zodValidation.success) {
            res.status(400).json({ error: "zod_validation_error", details: zodValidation.error.message })
            return;
        }
        const { chat } = zodValidation.data;
        console.log("chat", chat);
        const { messages, provider, base_url, model, temperature, max_tokens } = chat;

        const userData = await verifyUser(req, res);
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
            const msgs: AnthropicInput[] = messages.map((msg) => ({
                role: msg.role,
                content: [{
                    type: "text",
                    text: msg.content,
                }],
            }));

            const modelCapabilities = anthropicModels.find((m) => m.modelName === model);
            if (!modelCapabilities) {
                res.write(`data: ${JSON.stringify({ error: "model_not_found", details: "Model not found" })}\n\n`);
                res.end();
                return;
            }

            try {
                await anthropicChatStream(
                    msgs, 
                    modelCapabilities.modelName, 
                    modelCapabilities.maxOutputTokens, 
                    modelCapabilities.thinking,
                    (event) => {
                        console.log(event.type);
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
            const msgs: GeminiInput[] = messages.map((msg) => ({
                role: msg.role,
                parts: [{ text: msg.content }],
            }));

            const modelCapabilities = geminiModels.find((m) => m.modelName === model);
            if (!modelCapabilities) {
                res.write(`data: ${JSON.stringify({ error: "model_not_found", details: "Model not found" })}\n\n`);
                res.end();
                return;
            }

            try {
                await geminiChatStream(
                    msgs, 
                    modelCapabilities.modelName, 
                    modelCapabilities.maxOutputTokens, 
                    modelCapabilities.thinking,
                    (event) => {
                        console.log(event.type);
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
        } else if (provider === "openai") {
            const msgs: OpenAIInput[] = messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
            }));

            const modelCapabilities = openaiModels.find((m) => m.modelName === model);
            if (!modelCapabilities) {
                res.write(`data: ${JSON.stringify({ error: "model_not_found", details: "Model not found" })}\n\n`);
                res.end();
                return;
            }

            try {
                await openaiChatStream(
                    msgs, 
                    modelCapabilities.modelName, 
                    modelCapabilities.maxOutputTokens, 
                    modelCapabilities.thinking,
                    (event) => {
                        console.log(event.type);
                        res.write(`${JSON.stringify(event)}\n`);
                        
                        if (event.type === 'final') {
                            res.write(`{"type":"done"}\n`);
                            res.end();
                        }
                    },
                    base_url
                );

            } catch (error) {
                res.write(`data: ${JSON.stringify({ error: "stream_error", details: error })}\n\n`);
                res.end();
            }
        } else if (provider === "other") {
            const msgs: OpenAIInput[] = messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
            }));

            const modelCapabilities = otherModels.find((m) => m.modelName === model);
            if (!modelCapabilities) {
                res.write(`data: ${JSON.stringify({ error: "model_not_found", details: "Model not found" })}\n\n`);
                res.end();
                return;
            }

            try {
                await openaiChatStream(
                    msgs, 
                    modelCapabilities.modelName, 
                    modelCapabilities.maxOutputTokens, 
                    modelCapabilities.thinking,
                    (event) => {
                        console.log(event.type);
                        res.write(`${JSON.stringify(event)}\n`);
                        
                        if (event.type === 'final') {
                            res.write(`{"type":"done"}\n`);
                            res.end();
                        }
                    },
                    base_url
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
        const userData = await verifyUser(req, res);
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