import Anthropic from "@anthropic-ai/sdk";
import { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { anthropicTools } from "../context/tools";
import { SYSTEM_PROMPT } from "../context/prompts";
import { anthropicAPIKey } from "..";

const anthropicClient = new Anthropic({
    apiKey: anthropicAPIKey,
});

export async function anthropicChat(messages: MessageParam[], model: string, max_tokens: number, thinking: boolean) {
    const response = await anthropicClient.messages.create({
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
            text: SYSTEM_PROMPT,
            cache_control: {
                type: "ephemeral"
            }
        }],
        tools: anthropicTools,
        messages: messages,
    });

    const thinkingBlocks = response.content.filter(block => block.type === "thinking");
    const regularContent = response.content.filter(block => block.type !== "thinking");
    const toolCalls = response.content.filter(block => block.type === "tool_use");
    const finishReason = response.stop_reason;
    const usageMetadata = response.usage;

    return {
        ...response,
        thinking: thinkingBlocks,
        content: regularContent,
        toolCalls: toolCalls,
        getThinking: () => thinkingBlocks.map(block => 'content' in block ? block.content : '').join('\n'),
        hasThinking: () => thinkingBlocks.length > 0,
        finishReason: finishReason,
        usageMetadata: usageMetadata,
    };
}