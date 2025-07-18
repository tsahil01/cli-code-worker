import { planSchema } from "../types";
import { z } from "zod";
import { addOnesConfig } from "../context/prompts/lite/add-ons/add-ons-configure";
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "../context/prompts/full/prompts";
import { LITE_SYSTEM_PROMPT } from "../context/prompts/lite/prompts";
import { openaiTools } from "../context/tools";
import { ResponseInputItem } from "openai/resources/responses/responses";
import { Reasoning } from "openai/resources/index";

export async function openAIChatStream(messages: ResponseInputItem[], model: string, max_tokens: number, thinking: boolean, plan: z.infer<typeof planSchema>, apiKey: string, base_url: string | undefined, callback: (event: any) => void) {
    const addOns = addOnesConfig(plan);

    const openAIClient = new OpenAI({
        apiKey: apiKey,
        ...(base_url && { baseURL: base_url })
    });

    const msgs: ResponseInputItem[] = [{
        role: "system",
        content: plan.mode === "lite" ? LITE_SYSTEM_PROMPT(addOns) : SYSTEM_PROMPT
    }, ...messages]

    try {
        const stream = await openAIClient.responses.create({
            model,
            ...(thinking && { reasoning: { type: "enabled", effort: "medium" } as Reasoning }),
            input: msgs,
            tools: openaiTools,
            tool_choice: 'auto',
            stream: true,
        });

        let thinkingBlocks: any[] = [];
        let regularContent: any[] = [];
        let toolCalls: any[] = [];
        let finishReason: string | null = null;
        let usageMetadata: any = null;
        let fullMessage: any = null;

        for await (const chunk of stream) {
            switch (chunk.type) {
                case "response.reasoning.delta":
                    thinkingBlocks.push(chunk.delta);
                    callback({
                        type: "thinking",
                        content: chunk.delta,
                        block: chunk
                    });
                    break;
                case "response.reasoning.done":
                    break;

                case "response.output_text.delta":
                    regularContent.push(chunk.delta);
                    callback({
                        type: "content",
                        content: chunk.delta,
                        block: chunk,
                    });
                    break;

                case "response.output_text.done":
                    break;

                case "response.function_call_arguments.delta":
                    toolCalls.push(chunk);
                    callback({
                        type: "tool_call",
                        toolCall: chunk,
                    });
                    break;

                case "response.function_call_arguments.done":
                    break;

                case "response.completed":
                    finishReason = chunk.response.status || null;
                    usageMetadata = chunk.response.usage;
                    break;
            }
        }

        callback({
            type: "final",
            finishReason,
            usageMetadata,
            summary: {
                thinking: thinkingBlocks.join(""),
                hasThinking: thinkingBlocks.length > 0,
                toolCalls,
                content: regularContent.join(""),
            },
        });

    } catch (e) {
        console.error('Streaming error:', e);
        throw e;
    }
}

