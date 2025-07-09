import { GoogleGenAI, Content, Part } from "@google/genai";
import { anthropicTools } from "../context/tools";
import { geminiAPIKey } from "../index";
import { planSchema } from "../types";
import { z } from "zod";
import { addOnesConfig } from "../context/prompts/lite/add-ons/add-ons-configure";
import { LITE_SYSTEM_PROMPT } from "../context/prompts/lite/prompts";
import { SYSTEM_PROMPT } from "../context/prompts/full/prompts";

// Function to map roles to Gemini-compatible roles
function mapToGeminiRole(role: string): string {
    switch (role) {
        case 'assistant':
            return 'model';
        case 'user':
            return 'user';
        default:
            return 'user';
    }
}

export async function geminiChat(messages: Content[], model: string, max_tokens: number, thinking: boolean, plan: z.infer<typeof planSchema>) {
    const geminiClient = new GoogleGenAI({ apiKey: geminiAPIKey });
    const addOns = addOnesConfig(plan);

    const mappedMessages = messages.map(msg => ({
        ...msg,
        role: mapToGeminiRole(msg.role as string)
    }));

    const response = await geminiClient.models.generateContent({
        model,
        contents: mappedMessages,
        config: {
            systemInstruction: plan.mode === "lite" ? LITE_SYSTEM_PROMPT(addOns) : SYSTEM_PROMPT,
            maxOutputTokens: max_tokens,
            ...(thinking && {
                thinkingConfig: {
                    thinkingBudget: 1000,
                    includeThoughts: true,
                },
            }),
            tools:[{
                functionDeclarations: anthropicTools
            }]
        },
    });

    const thinkingBlocks = response.candidates?.[0]?.content?.parts?.filter((part: Part) => {
        return part.thought === true;
    });
    const regularContent = response.candidates?.[0]?.content?.parts?.filter((part: Part) => {
        return part.text && part.thought !== true;
    });
    const toolCalls = response.candidates?.[0]?.content?.parts?.filter((part: Part) => {
        return part.functionCall;
    });
    const finishReason = response.candidates?.[0]?.finishReason;
    const usageMetadata = response.usageMetadata;

    const getThinking = () => thinkingBlocks?.map(block => block.text || '').join('\n');
    const hasThinking = () => thinkingBlocks && thinkingBlocks.length > 0;

    return {
        thinking: thinkingBlocks,
        content: regularContent,
        toolCalls: toolCalls,
        getThinking: getThinking(),
        hasThinking: hasThinking(),
        finishReason: finishReason,
        usageMetadata: usageMetadata,
    };
}

export async function geminiChatStream(messages: Content[], model: string, max_tokens: number, thinking: boolean, plan: z.infer<typeof planSchema>, callback: (event: any) => void) {
    console.log("MSFSS", JSON.stringify(messages))
    const geminiClient = new GoogleGenAI({ apiKey: geminiAPIKey });
    const addOns = addOnesConfig(plan); 
    try {
        // Map roles to Gemini-compatible roles
        const mappedMessages = messages.map(msg => ({
            ...msg,
            role: mapToGeminiRole(msg.role as string)
        }));

        const stream = await geminiClient.models.generateContentStream({
            model,
            contents: mappedMessages,
            config: {
                systemInstruction: plan.mode === "lite" ? LITE_SYSTEM_PROMPT(addOns) :  SYSTEM_PROMPT,
                maxOutputTokens: max_tokens,
                temperature: 0.7,
                ...(thinking && {
                    thinkingConfig: {
                        thinkingBudget: 1000,
                        includeThoughts: true,
                    },
                }),
                tools:[{
                    functionDeclarations: anthropicTools
                }]
            },
        });

        let thinkingBlocks: any[] = [];
        let regularContent: any[] = [];
        let toolCalls: any[] = [];
        let finishReason: string | null = null;
        let usageMetadata: any = null;

        // Process stream chunks
        for await (const chunk of stream) {
            const candidate = chunk.candidates?.[0];
            if (!candidate) continue;

            // Process content parts
            if (candidate.content?.parts) {
                for (const part of candidate.content.parts) {
                    if (part.thought === true) {
                        // Thinking content
                        thinkingBlocks.push(part);
                        callback({
                            type: 'thinking',
                            content: part.text || '',
                            block: part
                        });
                    } else if (part.functionCall) {
                        // Tool call
                        toolCalls.push(part);
                        callback({
                            type: 'tool_call',
                        });
                    } else if (part.text) {
                        // Regular text content
                        regularContent.push(part);
                        callback({
                            type: 'content',
                            content: part.text,
                            block: part
                        });
                    }
                }
            }

            // Update metadata
            if (candidate.finishReason) {
                finishReason = candidate.finishReason;
            }
            if (chunk.usageMetadata) {
                usageMetadata = chunk.usageMetadata;
            }
        }

        // Send final summary
        callback({
            type: 'final',
            finishReason,
            usageMetadata,
            summary: {
                thinking: thinkingBlocks.map(block => block.text || '').join('\n'),
                hasThinking: thinkingBlocks.length > 0,
                toolCalls,
                content: regularContent
            }
        });

    } catch (error) {
        console.error('Gemini streaming error:', error);
        throw error;
    }
}
