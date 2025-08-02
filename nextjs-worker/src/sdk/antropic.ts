import Anthropic from "@anthropic-ai/sdk";
import { Message, MessageDeltaUsage, MessageParam, StopReason, ToolUseBlock } from "@anthropic-ai/sdk/resources/messages";
import { anthropicTools } from "../context/tools";
import { ResponseUsageMetadata, type planSchema } from "../types";
import { z } from "zod";
import { addOnesConfig } from "@/context/prompts/lite/add-ons/add-ons-configure";
import { LITE_SYSTEM_PROMPT } from "@/context/prompts/lite/prompts";
import { SYSTEM_PROMPT } from "@/context/prompts/full/prompts";

export async function anthropicChatStream(messages: MessageParam[], model: string, max_tokens: number, thinking: boolean, plan: z.infer<typeof planSchema>, apiKey: string, base_url: string | undefined, callback: (event: any) => void) {
    const addOns = addOnesConfig(plan);

    const anthropicClient = new Anthropic({
        apiKey: apiKey,
        ...(base_url && { baseURL: base_url }),
    });

    try {
        const stream = await anthropicClient.messages.stream({
            model,
            max_tokens,
            ...(thinking && {
                thinking: {
                    type: "enabled",
                    budget_tokens: thinking ? 1025 : 0,
                }
            }),
            system: [{
                type: "text",
                text: plan.mode === "lite" ? LITE_SYSTEM_PROMPT(addOns) : SYSTEM_PROMPT,
                cache_control: {
                    type: "ephemeral"
                }
            }],
            tools: anthropicTools,
            messages: messages,
        });

        let thinkingBlocks: any[] = [];
        let regularContent: any[] = [];
        let toolCalls: ToolUseBlock[] = [];
        let finishReason: StopReason | null = null;
        let usageMetadata: ResponseUsageMetadata | null = null;
        let fullMessage: Message | null = null;

        stream.on('message', (message) => {
            fullMessage = message;
            finishReason = message.stop_reason;
            const usage = message.usage as MessageDeltaUsage | undefined;
            if (usage) {
                usageMetadata = {
                    inputTokens: usage.input_tokens || 0,
                    outputTokens: usage.output_tokens || 0,
                    cacheInputTokens: usage.cache_creation_input_tokens || 0,
                    cacheReadTokens: usage.cache_read_input_tokens || 0,
                };
            }
        });

        stream.on('contentBlock', (contentBlock) => {
            if (contentBlock.type === "thinking") {
                thinkingBlocks.push(contentBlock);
                callback({
                    type: 'thinking',
                    content: 'thinking' in contentBlock ? contentBlock.thinking : '',
                    block: contentBlock
                });
            } else if (contentBlock.type === "tool_use") {
                toolCalls.push(contentBlock);
                callback({
                    type: 'tool_call',
                    toolCall: contentBlock
                });
            } else if (contentBlock.type === "text") {
                regularContent.push(contentBlock);
                callback({
                    type: 'content',
                    content: 'text' in contentBlock ? contentBlock.text : '',
                    block: contentBlock
                });
            }
        });

        await stream.finalMessage();

        callback({
            type: 'final',
            sdk: "anthropic",
            finishReason,
            usageMetadata,
            fullMessage,
            summary: {
                thinking: thinkingBlocks.map(block => 'thinking' in block ? block.thinking : '').join('\n'),
                hasThinking: thinkingBlocks.length > 0,
                toolCalls,
                content: regularContent
            }
        });

    } catch (error) {
        console.error('Streaming error:', error);
        throw error;
    }
}