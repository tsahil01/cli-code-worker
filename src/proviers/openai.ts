import OpenAI from "openai";
import { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";
import { anthropicTools } from "../context/tools";
import { openAIAPIKey } from "../index";
import { planSchema } from "../types";
import { z } from "zod";
import { LITE_SYSTEM_PROMPT } from "../context/prompts/lite/prompts";
import { SYSTEM_PROMPT } from "../context/prompts/full/prompts";
import { addOnesConfig } from "../context/prompts/lite/add-ons/add-ons-configure";

// Convert Anthropic tools to OpenAI format
function convertToolsToOpenAI(): ChatCompletionTool[] {
    return anthropicTools.map(tool => ({
        type: "function" as const,
        function: {
            name: (tool as any).name,
            description: (tool as any).description,
            parameters: (tool as any).input_schema
        }
    }));
}


export async function openaiChatStream(messages: ChatCompletionMessageParam[], model: string, max_tokens: number, thinkingEnabled: boolean, plan: z.infer<typeof planSchema>,   callback: (event: any) => void, baseUrl?: string) {
    const apiKey = openAIAPIKey || "any_other_key";
    const    addOns = addOnesConfig(plan);
    const openaiClient = new OpenAI({
        apiKey: apiKey,
        ...(baseUrl && { baseURL: baseUrl })
    });

    const systemMessage: ChatCompletionMessageParam = {
        role: "system",
        content: plan.mode === "lite" ? LITE_SYSTEM_PROMPT(addOns) : SYSTEM_PROMPT
    };

    const allMessages = [systemMessage, ...messages];

    try {
        const stream = await openaiClient.chat.completions.create({
            model,
            messages: allMessages,
            max_tokens,
            tools: convertToolsToOpenAI(),
            tool_choice: "auto",
            stream: true,
        });

        let content: any[] = [];
        let toolCalls: any[] = [];
        let thinkingBlocks: any[] = [];
        let finishReason: string | null = null;
        let usageMetadata: any = null;
        let currentContent = '';
        let currentToolCall: any = null;
        let toolCallsMap = new Map();

        for await (const chunk of stream) {
            const choice = chunk.choices[0];
            if (!choice) continue;

            const delta = choice.delta;

            // Handle regular content
            if (delta.content) {
                currentContent += delta.content;
                content.push({ type: 'text', text: delta.content });
                callback({
                    type: 'content',
                    content: delta.content,
                    block: { type: 'text', text: currentContent }
                });
            }

            // Handle tool calls
            if (delta.tool_calls) {
                for (const toolCall of delta.tool_calls) {
                    if (toolCall.index !== undefined) {
                        const index = toolCall.index;
                        
                        if (!toolCallsMap.has(index)) {
                            toolCallsMap.set(index, {
                                index: index,
                                id: toolCall.id || '',
                                type: 'function',
                                function: {
                                    name: '',
                                    arguments: ''
                                }
                            });
                        }

                        const existingToolCall = toolCallsMap.get(index);

                        if (toolCall.id) {
                            existingToolCall.id = toolCall.id;
                        }
                        
                        if (toolCall.function?.name) {
                            existingToolCall.function.name += toolCall.function.name;
                        }
                        
                        if (toolCall.function?.arguments) {
                            existingToolCall.function.arguments += toolCall.function.arguments;
                        }
                    }
                }

                callback({
                    type: 'tool_call'
                });
            }

            // Handle finish reason
            if (choice.finish_reason) {
                finishReason = choice.finish_reason;
            }

            // Handle usage (usually comes at the end)
            if (chunk.usage) {
                usageMetadata = chunk.usage;
            }
        }

        // Convert tool calls map to array
        toolCalls = Array.from(toolCallsMap.values());

        // Send final summary
        callback({
            type: 'final',
            finishReason,
            usageMetadata,
            summary: {
                thinking: '',
                hasThinking: false,
                toolCalls,
                content: content
            }
        });

    } catch (error) {
        console.error('OpenAI streaming error:', error);
        throw error;
    }
}