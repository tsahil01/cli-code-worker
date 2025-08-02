import { GoogleGenAI, Content } from "@google/genai";
import { geminiTools } from "../context/tools";
import { planSchema, ResponseUsageMetadata } from "../types";
import { z } from "zod";
import { addOnesConfig } from "@/context/prompts/lite/add-ons/add-ons-configure";
import { LITE_SYSTEM_PROMPT } from "@/context/prompts/lite/prompts";
import { SYSTEM_PROMPT } from "@/context/prompts/full/prompts";

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

export async function geminiChatStream(messages: Content[], model: string, max_tokens: number, thinking: boolean, plan: z.infer<typeof planSchema>, apiKey: string, callback: (event: any) => void) {
    const geminiClient = new GoogleGenAI({ apiKey: apiKey });
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
                systemInstruction: plan.mode === "lite" ? LITE_SYSTEM_PROMPT(addOns) : SYSTEM_PROMPT,
                maxOutputTokens: max_tokens,
                temperature: 0.7,
                ...(thinking && {
                    thinkingConfig: {
                        thinkingBudget: 1000,
                        includeThoughts: true,
                    },
                }),
                tools: [{
                    functionDeclarations: geminiTools
                }]
            },
        });

        let thinkingBlocks: any[] = [];
        let regularContent: any[] = [];
        let toolCalls: any[] = [];
        let finishReason: string | null = null;
        let usageMetadata: ResponseUsageMetadata | null = null;

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
                let usage = chunk.usageMetadata;
                if (usage) {
                    usageMetadata = {
                        cacheInputTokens: usage.cachedContentTokenCount ?? 0,
                        inputTokens: usage.promptTokenCount ?? 0,
                        cacheReadTokens: usage.cachedContentTokenCount ?? 0, // Adjust if you're summing `cacheTokensDetails`
                        outputTokens: usage.candidatesTokenCount ?? 0
                    }
                }
            }
        }

        // Send final summary
        callback({
            type: 'final',
            sdk: "gemini",
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
