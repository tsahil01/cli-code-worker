import { GoogleGenAI, Content, Part } from "@google/genai";
import { anthropicTools } from "../context/tools";
import { SYSTEM_PROMPT } from "../context/prompts";
import { geminiAPIKey } from "../index";


export async function geminiChat(messages: Content[], model: string, max_tokens: number, thinking: boolean) {
    const geminiClient = new GoogleGenAI({ apiKey: geminiAPIKey });

    const response = await geminiClient.models.generateContent({
        model,
        contents: messages,
        config: {
            systemInstruction: SYSTEM_PROMPT,
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

export async function geminiChatStream(messages: Content[], model: string, max_tokens: number, thinking: boolean, callback: (event: any) => void) {
    console.log('Gemini streaming started');
    const geminiClient = new GoogleGenAI({ apiKey: geminiAPIKey });

    try {
        const stream = await geminiClient.models.generateContentStream({
            model,
            contents: messages,
            config: {
                systemInstruction: SYSTEM_PROMPT,
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
                            toolCall: part
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
