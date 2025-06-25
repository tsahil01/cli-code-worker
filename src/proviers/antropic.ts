import Anthropic from "@anthropic-ai/sdk";
import { Message } from "@anthropic-ai/sdk/resources/messages";
import { anthropicTools } from "../context/tools";

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
                budget_tokens: 1000,
            }
        }),
        system: [{
            type: "text",
            text: "You are a helpful assistant.",
            cache_control: {
                type: "ephemeral"
            }
        }],
        tools: anthropicTools,
        messages: messages,
    });

    return response;
}