import { planSchema, ResponseUsageMetadata } from "@/types";
import { z } from "zod";
import { addOnesConfig } from "@/context/prompts/lite/add-ons/add-ons-configure";
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "@/context/prompts/full/prompts";
import { LITE_SYSTEM_PROMPT } from "@/context/prompts/lite/prompts";
import { openaiTools } from "@/context/tools";
import { ChatCompletionMessageParam } from "openai/resources/index";

export async function openAIChatCompletionStream(messages: ChatCompletionMessageParam[], model: string, max_tokens: number, thinking: boolean, plan: z.infer<typeof planSchema>, apiKey: string, base_url: string | undefined, callback: (event: any) => void) {
    const addOns = addOnesConfig(plan);

    const openAIClient = new OpenAI({
        apiKey: apiKey,
        ...(base_url && { baseURL: base_url })
    });

    const msgs: ChatCompletionMessageParam[] = [{
        role: "system",
        content: plan.mode === "lite" ? LITE_SYSTEM_PROMPT(addOns) : SYSTEM_PROMPT
    }, ...messages]

    try {
        const stream = await openAIClient.chat.completions.create({
            model,
            messages: msgs,
            tools: openaiTools,
            tool_choice: 'auto',
            stream: true,
            ...(thinking && { reasoning_effort: "medium" }),
            stream_options: { include_usage: true },
            ...(base_url == "https://api.moonshot.ai/v1" && { enable_context_caching: true }) // kimi k2 cache
        });

        let thinkingBlocks: any[] = [];
        let regularContent: any[] = [];
        let toolCallsMap: Map<number, any> = new Map();
        let finishReason: string | null = null;
        let usageMetadata: ResponseUsageMetadata | null = null;

        // @ts-ignore
        for await (const chunk of stream) {
            if (chunk.choices && chunk.choices.length > 0) {
                const choice = chunk.choices[0];

                if ((choice.delta as any)?.reasoning) {
                    thinkingBlocks.push((choice.delta as any).reasoning);
                    callback({
                        type: "thinking",
                        content: (choice.delta as any).reasoning,
                        block: chunk,
                    });
                }

                if (choice.delta?.content) {
                    regularContent.push(choice.delta.content);
                    callback({
                        type: "content",
                        content: choice.delta.content,
                        block: chunk,
                    });
                }

                if (choice.delta?.tool_calls) {
                    for (const toolCall of choice.delta.tool_calls) {
                        const index = toolCall.index;

                        if (!toolCallsMap.has(index)) {
                            toolCallsMap.set(index, {
                                index: index,
                                id: toolCall.id || `call_${Date.now()}_${index}`,
                                type: toolCall.type || "function",
                                function: {
                                    name: toolCall.function?.name || "",
                                    arguments: toolCall.function?.arguments || ""
                                }
                            });
                        }
                        const existingCall = toolCallsMap.get(index);
                        if (toolCall.function?.name) {
                            existingCall.function.name = toolCall.function.name;
                        }
                        if (toolCall.function?.arguments) {
                            existingCall.function.arguments += toolCall.function.arguments;
                        }
                        if (toolCall.id) {
                            existingCall.id = toolCall.id;
                        }
                    }

                    callback({
                        type: "tool_call",
                        toolCall: choice.delta,
                    });
                }

                if (choice.finish_reason) {
                    finishReason = choice.finish_reason;
                    const usage = chunk.usage;
                    if (usage) {
                        usageMetadata = {
                            cacheInputTokens: 0,
                            inputTokens: usage.prompt_tokens || 0,
                            cacheReadTokens: 0,
                            outputTokens: usage.completion_tokens || 0
                        };
                    }
                }

            }

            if (chunk.usage) {
                const usage = chunk.usage;
                if (usage) {
                    usageMetadata = {
                        cacheInputTokens: 0,
                        inputTokens: usage.prompt_tokens || 0,
                        cacheReadTokens: 0,
                        outputTokens: usage.completion_tokens || 0
                    };
                }
            }
        }

        const finalToolCalls = Array.from(toolCallsMap.values());

        callback({
            type: "final",
            sdk: "openai",
            finishReason,
            usageMetadata,
            summary: {
                thinking: thinkingBlocks.join(""),
                hasThinking: thinkingBlocks.length > 0,
                toolCalls: finalToolCalls,
                content: regularContent.join(""),
            },
        });


    } catch (e) {
        console.error('Streaming error:', e);
        throw e;
    }
}
