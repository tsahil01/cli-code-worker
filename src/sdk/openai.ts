import { planSchema } from "../types";
import { z } from "zod";
import { addOnesConfig } from "../context/prompts/lite/add-ons/add-ons-configure";
import OpenAI from "openai";
import { SYSTEM_PROMPT } from "../context/prompts/full/prompts";
import { LITE_SYSTEM_PROMPT } from "../context/prompts/lite/prompts";
import { openaiTools } from "../context/tools";
import { ResponseInputItem } from "openai/resources/responses/responses";
import { ChatCompletionMessageParam, Reasoning } from "openai/resources/index";

// export async function openAIResponseStream(messages: ResponseInputItem[], model: string, max_tokens: number, thinking: boolean, plan: z.infer<typeof planSchema>, apiKey: string, base_url: string | undefined, callback: (event: any) => void) {
//     const addOns = addOnesConfig(plan);

//     const openAIClient = new OpenAI({
//         apiKey: apiKey,
//         ...(base_url && { baseURL: base_url })
//     });

//     const msgs: ResponseInputItem[] = [{
//         role: "system",
//         content: plan.mode === "lite" ? LITE_SYSTEM_PROMPT(addOns) : SYSTEM_PROMPT
//     }, ...messages]

//     try {
//         const stream = await openAIClient.responses.create({
//             model,
//             ...(thinking && { reasoning: { type: "enabled", effort: "medium" } as Reasoning }),
//             input: msgs,
//             tools: openaiTools,
//             tool_choice: 'auto',
//             stream: true,
//         });

//         let thinkingBlocks: any[] = [];
//         let regularContent: any[] = [];
//         let toolCalls: any[] = [];
//         let finishReason: string | null = null;
//         let usageMetadata: any = null;
//         let fullMessage: any = null;

//         for await (const chunk of stream) {
//             switch (chunk.type) {
//                 case "response.reasoning.delta":
//                     thinkingBlocks.push(chunk.delta);
//                     callback({
//                         type: "thinking",
//                         content: chunk.delta,
//                         block: chunk
//                     });
//                     break;
//                 case "response.reasoning.done":
//                     break;

//                 case "response.output_text.delta":
//                     regularContent.push(chunk.delta);
//                     callback({
//                         type: "content",
//                         content: chunk.delta,
//                         block: chunk,
//                     });
//                     break;

//                 case "response.output_text.done":
//                     break;

//                 case "response.function_call_arguments.delta":
//                     toolCalls.push(chunk);
//                     callback({
//                         type: "tool_call",
//                         toolCall: chunk,
//                     });
//                     break;

//                 case "response.function_call_arguments.done":
//                     break;

//                 case "response.completed":
//                     finishReason = chunk.response.status || null;
//                     usageMetadata = chunk.response.usage;
//                     break;
//             }
//         }

//         callback({
//             type: "final",
//             finishReason,
//             usageMetadata,
//             summary: {
//                 thinking: thinkingBlocks.join(""),
//                 hasThinking: thinkingBlocks.length > 0,
//                 toolCalls,
//                 content: regularContent.join(""),
//             },
//         });

//     } catch (e) {
//         console.error('Streaming error:', e);
//         throw e;
//     }
// }

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
            ...(thinking && { reasoning: { type: "enabled", effort: "medium" } as Reasoning }),
        });

        let thinkingBlocks: any[] = [];
        let regularContent: any[] = [];
        let toolCallsMap: Map<number, any> = new Map();
        let finishReason: string | null = null;
        let usageMetadata: any = null;

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
                    console.log("tool_calls", JSON.stringify(choice.delta, null, 2));
                    
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
                    usageMetadata = chunk.usage;
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
