import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { openaiTools } from "../context/tools";
import { openAIAPIKey } from "../index";
import { planSchema } from "../types";
import { z } from "zod";
import { LITE_SYSTEM_PROMPT } from "../context/prompts/lite/prompts";
import { SYSTEM_PROMPT } from "../context/prompts/full/prompts";
import { addOnesConfig } from "../context/prompts/lite/add-ons/add-ons-configure";


export async function openaiChatStream(messages: ChatCompletionMessageParam[], model: string, max_tokens: number, thinkingEnabled: boolean, plan: z.infer<typeof planSchema>, callback: (event: any) => void, baseUrl?: string) {
    const apiKey = openAIAPIKey || "any_other_key";
    const addOns = addOnesConfig(plan);
    const openaiClient = new OpenAI({
        apiKey: apiKey,
        ...(baseUrl && { baseURL: baseUrl })
    });

    let systemContent = plan.mode === "lite" ? LITE_SYSTEM_PROMPT(addOns) : SYSTEM_PROMPT;

    const systemMessage: ChatCompletionMessageParam = {
        role: "system",
        content: systemContent
    };

    const allMessages = [systemMessage, ...messages];



    try {
        if (thinkingEnabled) {
            try {
                const responsesInput = allMessages.map(msg => ({
                    role: msg.role,
                    content: msg.content,
                    ...(msg.role === "user" && { type: "message" })
                }));

                const responsesApi = (openaiClient as any).responses;
                if (responsesApi && responsesApi.create) {
                    const response = await responsesApi.create({
                        model,
                        input: responsesInput,
                        max_output_tokens: max_tokens,
                        tools: openaiTools,
                        reasoning: {
                            effort: "medium",
                            summary: "auto"
                        }
                    });

                    let content: any[] = [];
                    let toolCalls: any[] = [];
                    let thinkingBlocks: any[] = [];
                    let finishReason = response.status || "completed";
                    let usageMetadata = response.usage;

                    for (const item of response.output || []) {
                        if (item.type === 'reasoning') {
                            const summaries = item.summary || [];
                            for (const summary of summaries) {
                                if (summary.text) {
                                    thinkingBlocks.push({ type: 'thinking', content: summary.text });
                                    callback({
                                        type: 'thinking',
                                        content: summary.text,
                                        block: { type: 'thinking', content: summary.text }
                                    });
                                }
                            }
                        } else if (item.type === 'message') {
                            for (const contentItem of item.content || []) {
                                if (contentItem.type === 'output_text') {
                                    content.push({ type: 'text', text: contentItem.text });
                                    callback({
                                        type: 'content',
                                        content: contentItem.text,
                                        block: { type: 'text', text: contentItem.text }
                                    });
                                }
                            }
                        } else if (item.type === 'function_call') {
                            console.log("TOOOOL", item);
                            toolCalls.push({
                                id: item.call_id,
                                type: 'function',
                                function: {
                                    name: item.name,
                                    arguments: item.arguments
                                }
                            });
                            callback({
                                type: 'tool_call',
                                toolCall: item
                            });
                        }
                    }

                    callback({
                        type: 'final',
                        finishReason,
                        usageMetadata,
                        summary: {
                            thinking: thinkingBlocks.map(block => block.content).join('\n'),
                            hasThinking: thinkingBlocks.length > 0,
                            toolCalls,
                            content: content
                        }
                    });

                    return;
                }
            } catch (error) {
            }
        }

        const stream = await openaiClient.chat.completions.create({
            model,
            messages: allMessages,
            max_tokens,
            tools: openaiTools,
            tool_choice: "auto",
            stream: true,
        });

        let content: any[] = [];
        let toolCalls: any[] = [];
        let thinkingBlocks: any[] = [];
        let finishReason: string | null = null;
        let usageMetadata: any = null;
        let currentContent = '';

        for await (const chunk of stream) {
            const choice = chunk.choices[0];
            if (!choice) continue;

            const delta = choice.delta;

            if (delta.content) {
                currentContent += delta.content;
                content.push({ type: 'text', text: delta.content });
                callback({
                    type: 'content',
                    content: delta.content,
                    block: { type: 'text', text: currentContent }
                });
            }

            if (delta.tool_calls) {
                const toolCall = delta.tool_calls[0];
                if (toolCall && toolCall.function?.name) {
                    console.log("TOOOOL", toolCall);
                    toolCalls.push({
                        id: toolCall.id,
                        type: 'function',
                        function: {
                            name: toolCall.function.name,
                            arguments: toolCall.function?.arguments || ''
                        }
                    });
                    callback({
                        type: 'tool_call',
                        toolCall: toolCall
                    });
                }
            }

            if (choice.finish_reason) {
                finishReason = choice.finish_reason;
            }

            if (chunk.usage) {
                usageMetadata = chunk.usage;
            }
        }

        callback({
            type: 'final',
            finishReason,
            usageMetadata,
            summary: {
                thinking: thinkingBlocks.map(block => block.content).join('\n'),
                hasThinking: thinkingBlocks.length > 0,
                toolCalls,
                content: content
            }
        });

    } catch (error) {
        console.error('OpenAI streaming error:', error);
        throw error;
    }
}