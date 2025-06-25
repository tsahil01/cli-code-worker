import Anthropic from "@anthropic-ai/sdk";
import { Message } from "@anthropic-ai/sdk/resources/messages";
import { anthropicTools } from "../context/tools";
import { SYSTEM_PROMPT } from "../context/prompts";

const anthropicClient = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function anthropicChat(messages: Message[], model: string, max_tokens: number, thinking: boolean) {
    const response = await anthropicClient.messages.create({
        model,
        max_tokens,
        ...(thinking && {
            thinking: {
                type: "enabled",
                budget_tokens: thinking ? 1000 : 0,
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

    // Extract thinking blocks and regular content
    const thinkingBlocks = response.content.filter(block => block.type === "thinking");
    const regularContent = response.content.filter(block => block.type !== "thinking");
    const toolCalls = response.content.filter(block => block.type === "tool_use");

    return {
        ...response,
        thinking: thinkingBlocks,
        content: regularContent,
        // Helper methods to access thinking
        getThinking: () => thinkingBlocks.map(block => 'content' in block ? block.content : '').join('\n'),
        hasThinking: () => thinkingBlocks.length > 0
    };
}