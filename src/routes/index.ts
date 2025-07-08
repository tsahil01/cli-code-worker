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

// Test route that mimics /chat but returns mock responses
router.post("/test/chat", async (req, res) => {
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

        // Mock response that mimics the structure of actual LLM responses
        const createMockResponse = (provider: string, model: string) => {
            const lastUserMessage = messages.filter(msg => msg.role === "user").pop()?.content || "Hello";
            
            // Decide whether to simulate tool calling (30% chance)
            const shouldCallTool = Math.random() < 0.3;
            let mockToolCalls: any[] = [];
            let mockMessage: string;
            
            if (shouldCallTool) {
                mockMessage = `I'll help you with that. Let me check some files first. This is a test response from ${provider} model ${model}. Based on the file structure, I can see your project organization.`;
                
                // Create mock tool calls based on provider format
                if (provider === "anthropic") {
                    mockToolCalls.push({
                        type: "tool_use",
                        id: "toolu_test123",
                        name: "list_files",
                        input: { filePath: "./src" }
                    });
                } else if (provider === "gemini") {
                    mockToolCalls.push({
                        functionCall: {
                            name: "list_files",
                            args: { filePath: "./src" }
                        }
                    });
                } else if (provider === "openai" || provider === "other") {
                    mockToolCalls.push({
                        id: "call_test123",
                        type: "function",
                        function: {
                            name: "list_files",
                            arguments: JSON.stringify({ filePath: "./src" })
                        }
                    });
                }
            } else {
                mockMessage = `This is a test response from ${provider} model ${model}. You said: "${lastUserMessage}"`;
            }
            
            return {
                message: mockMessage,
                thinking: provider === "anthropic" ? 
                    (shouldCallTool ? "I should check the files to give a helpful response..." : "This is mock thinking content for testing purposes.") : 
                    undefined,
                hasThinking: provider === "anthropic",
                toolCalls: mockToolCalls,
                finishReason: "stop",
                usageMetadata: {
                    inputTokens: 50,
                    outputTokens: mockMessage.split(' ').length,
                    totalTokens: 50 + mockMessage.split(' ').length
                }
            };
        };

        if (provider === "anthropic") {
            const modelCapabilities = anthropicModels.find((m) => m.modelName === model);
            if (!modelCapabilities) {
                res.status(400).json({ error: "model_not_found", details: "Model not found" })
                return;
            }

            const mockResponse = createMockResponse(provider, model);
            res.status(200).json(mockResponse);

        } else if (provider === "gemini") {
            const modelCapabilities = geminiModels.find((m) => m.modelName === model);
            if (!modelCapabilities) {
                res.status(400).json({ error: "model_not_found", details: "Model not found" })
                return;
            }

            const mockResponse = createMockResponse(provider, model);
            // Gemini has slightly different response structure
            mockResponse.thinking = undefined;
            mockResponse.hasThinking = false;
            res.status(200).json(mockResponse);

        } else if (provider === "openai") {
            const modelCapabilities = openaiModels.find((m) => m.modelName === model);
            if (!modelCapabilities) {
                res.status(400).json({ error: "model_not_found", details: "Model not found" })
                return;
            }

            const mockResponse = createMockResponse(provider, model);
            // OpenAI thinking support depends on model capabilities
            mockResponse.thinking = modelCapabilities.thinking ? "Mock thinking for OpenAI model." : undefined;
            mockResponse.hasThinking = !!modelCapabilities.thinking;
            res.status(200).json(mockResponse);

        } else if (provider === "other") {
            const modelCapabilities = otherModels.find((m) => m.modelName === model);
            if (!modelCapabilities) {
                res.status(400).json({ error: "model_not_found", details: "Model not found" })
                return;
            }

            const mockResponse = createMockResponse(provider, model);
            mockResponse.thinking = modelCapabilities.thinking ? "Mock thinking for other model." : undefined;
            mockResponse.hasThinking = !!modelCapabilities.thinking;
            res.status(200).json(mockResponse);

        } else {
            res.status(400).json({ error: "provider_not_supported", details: "Provider not supported" })
        }

    } catch (error) {
        console.error("Error in /test/chat endpoint:", error);
        res.status(500).json({ error: "internal_server_error", details: error })
    }
});

router.post("/test/chat/stream", async (req, res) => {
    try {
        const zodValidation = chatValidation.safeParse(req.body)
        if (!zodValidation.success) {
            res.status(400).json({ error: "zod_validation_error", details: zodValidation.error.message })
            return;
        }
        const { chat } = zodValidation.data;
        console.log("test chat", chat);
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

        const simulateStream = async (provider: string, model: string) => {
            const lastUserMessage = messages.filter(msg => msg.role === "user").pop()?.content || "Hello";
            
            const shouldCallTool = Math.random() < 0.5;
            
            let mockMessage: string;
            let mockToolCalls: any[] = [];
            let followUpMessage: string = "";
            
            if (shouldCallTool) {
                // Generate tool scenario for propose_change_vscode only
                const scenarios = [
                    {
                        message: `I'll review your test file and propose some improvements to make the code cleaner and more readable.`,
                        tools: ['propose_change_vscode'],
                        followUp: `I've proposed several improvements to your test file including better formatting, cleaner console logging, and added documentation.`
                    }
                ];

                const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
                mockMessage = `${scenario.message} Response from ${provider} model ${model}.`;
                
                                // Create the propose_change_vscode tool call
                const toolId = `${Date.now()}_0`;
                
                if (provider === "anthropic") {
                    const input = {
                        title: "Improve test.ts code quality",
                        filePath: "/home/sahil/coding/cli-code/src/temp/test.ts",
                        changes: [
                            {
                                originalContent: "const count = 5;\nconsole.log('count: %d', count);\n// Prints: count: 5, to stdout\nconsole.log('count:', count);\n// Prints: count: 5, to stdout%",
                                proposedContent: "// Counter variable for demonstration\nconst count = 5;\n\n// Using template literals for cleaner output\nconsole.log(`Count value: ${count}`);\n// Prints: Count value: 5, to stdout\n\nconsole.log('Traditional format:', count);\n// Prints: Traditional format: 5, to stdout",
                                description: "Improve code formatting and use modern template literals"
                            }
                        ]
                    };
                    
                    mockToolCalls.push({
                        type: "tool_use",
                        id: `toolu_${toolId}`,
                        name: "propose_change_vscode",
                        input: input
                    });
                } else if (provider === "gemini") {
                    const args = {
                        title: "Improve test.ts code quality",
                        filePath: "/home/sahil/coding/cli-code/src/temp/test.ts",
                        changes: [
                            {
                                originalContent: "const count = 5;\nconsole.log('count: %d', count);\n// Prints: count: 5, to stdout\nconsole.log('count:', count);\n// Prints: count: 5, to stdout%",
                                proposedContent: "// Counter variable for demonstration\nconst count = 5;\n\n// Using template literals for cleaner output\nconsole.log(`Count value: ${count}`);\n// Prints: Count value: 5, to stdout\n\nconsole.log('Traditional format:', count);\n// Prints: Traditional format: 5, to stdout",
                                description: "Improve code formatting and use modern template literals"
                            }
                        ]
                    };
                    
                    mockToolCalls.push({
                        functionCall: {
                            name: "propose_change_vscode",
                            args: args
                        }
                    });
                } else if (provider === "openai" || provider === "other") {
                    const arguments_obj = {
                        title: "Improve test.ts code quality",
                        filePath: "/home/sahil/coding/cli-code/src/temp/test.ts",
                        changes: [
                            {
                                originalContent: "const count = 5;\nconsole.log('count: %d', count);\n// Prints: count: 5, to stdout\nconsole.log('count:', count);\n// Prints: count: 5, to stdout%",
                                proposedContent: "// Counter variable for demonstration\nconst count = 5;\n\n// Using template literals for cleaner output\nconsole.log(`Count value: ${count}`);\n// Prints: Count value: 5, to stdout\n\nconsole.log('Traditional format:', count);\n// Prints: Traditional format: 5, to stdout",
                                description: "Improve code formatting and use modern template literals"
                            }
                        ]
                    };
                    
                    mockToolCalls.push({
                        id: `call_${toolId}`,
                        type: "function",
                        function: {
                            name: "propose_change_vscode",
                            arguments: JSON.stringify(arguments_obj)
                        }
                    });
                }
                
                // Store the follow-up message for later use in the streaming
                followUpMessage = scenario.followUp;
            } else {
                mockMessage = `This is a test streaming response from ${provider} model ${model}. You said: "${lastUserMessage}"`;
            }
            
            const words = mockMessage.split(' ');
            let thinkingText: string | undefined;

            const modelCapabilities = 
                provider === "anthropic" ? anthropicModels.find(m => m.modelName === model) :
                provider === "gemini" ? geminiModels.find(m => m.modelName === model) :
                provider === "openai" ? openaiModels.find(m => m.modelName === model) :
                provider === "other" ? otherModels.find(m => m.modelName === model) : null;

            if (modelCapabilities?.thinking) {
                // Simulate thinking stream (matches real provider format)
                thinkingText = shouldCallTool ? 
                    "I should check the files to give a helpful response..." : 
                    "Let me think about this test response...";
                const thinkingWords = thinkingText.split(' ');
                
                for (const word of thinkingWords) {
                    res.write(`${JSON.stringify({ 
                        type: "thinking", 
                        content: word + ' ',
                        block: { type: "thinking", content: word + ' ' }
                    })}\n`);
                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }

            // Simulate content stream (matches real provider format)
            for (const word of words) {
                res.write(`${JSON.stringify({ 
                    type: "content", 
                    content: word + ' ',
                    block: { type: "text", text: word + ' ' }
                })}\n`);
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // Simulate tool calling if enabled
            if (shouldCallTool && mockToolCalls.length > 0) {
                for (const toolCall of mockToolCalls) {
                    res.write(`${JSON.stringify({ 
                        type: "tool_call",
                        toolCall: toolCall
                    })}\n`);
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
                
                // Add some delay to simulate tool execution
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Stream the follow-up message after tool execution
                const dynamicFollowUp = shouldCallTool && followUpMessage ? 
                    ` ${followUpMessage}` : 
                    " Based on the file structure, I can see your project organization.";
                const followUpWords = dynamicFollowUp.split(' ');
                
                for (const word of followUpWords) {
                    res.write(`${JSON.stringify({ 
                        type: "content", 
                        content: word + ' ',
                        block: { type: "text", text: word + ' ' }
                    })}\n`);
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
                
                // Update the final message for the summary
                mockMessage += dynamicFollowUp;
            }

            // Send final message (matches real provider format)
            res.write(`${JSON.stringify({ 
                type: "final",
                finishReason: "stop",
                usageMetadata: {
                    inputTokens: 50,
                    outputTokens: words.length,
                    totalTokens: 50 + words.length
                },
                summary: {
                    thinking: modelCapabilities?.thinking ? thinkingText : '',
                    hasThinking: !!modelCapabilities?.thinking,
                    toolCalls: mockToolCalls,
                    content: [{ type: "text", text: mockMessage }]
                }
            })}\n`);
        };

        if (provider === "anthropic") {
            const modelCapabilities = anthropicModels.find((m) => m.modelName === model);
            if (!modelCapabilities) {
                res.write(`${JSON.stringify({ error: "model_not_found", details: "Model not found" })}\n`);
                res.end();
                return;
            }

            try {
                await simulateStream(provider, model);
                res.write(`{"type":"done"}\n`);
                res.end();

            } catch (error) {
                res.write(`${JSON.stringify({ error: "stream_error", details: error })}\n`);
                res.end();
            }

        } else if (provider === "gemini") {
            const modelCapabilities = geminiModels.find((m) => m.modelName === model);
            if (!modelCapabilities) {
                res.write(`${JSON.stringify({ error: "model_not_found", details: "Model not found" })}\n`);
                res.end();
                return;
            }

            try {
                await simulateStream(provider, model);
                res.write(`{"type":"done"}\n`);
                res.end();

            } catch (error) {
                res.write(`${JSON.stringify({ error: "stream_error", details: error })}\n`);
                res.end();
            }

        } else if (provider === "openai") {
            const modelCapabilities = openaiModels.find((m) => m.modelName === model);
            if (!modelCapabilities) {
                res.write(`${JSON.stringify({ error: "model_not_found", details: "Model not found" })}\n`);
                res.end();
                return;
            }

            try {
                await simulateStream(provider, model);
                res.write(`{"type":"done"}\n`);
                res.end();

            } catch (error) {
                res.write(`${JSON.stringify({ error: "stream_error", details: error })}\n`);
                res.end();
            }

        } else if (provider === "other") {
            const modelCapabilities = otherModels.find((m) => m.modelName === model);
            if (!modelCapabilities) {
                res.write(`${JSON.stringify({ error: "model_not_found", details: "Model not found" })}\n`);
                res.end();
                return;
            }

            try {
                await simulateStream(provider, model);
                res.write(`{"type":"done"}\n`);
                res.end();

            } catch (error) {
                res.write(`${JSON.stringify({ error: "stream_error", details: error })}\n`);
                res.end();
            }

        } else {
            res.write(`${JSON.stringify({ error: "provider_not_supported", details: "Provider not supported" })}\n`);
            res.end();
        }

    } catch (error) {
        console.error("Error in /test/chat/stream endpoint:", error);
        res.write(`${JSON.stringify({ error: "internal_server_error", details: error })}\n`);
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