import { GoogleGenAI, Content, Part } from "@google/genai";
import { anthropicTools } from "../context/tools";
import { SYSTEM_PROMPT } from "../context/prompts";
import { geminiAPIKey } from "../index";

const geminiClient = new GoogleGenAI({ apiKey: geminiAPIKey });

export async function geminiChat(messages: Content[], model: string, max_tokens: number, thinking: boolean) {

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
        if (part.thought === true) return part;
    });
    const regularContent = response.candidates?.[0]?.content?.parts?.filter((part: Part) => {
        if (part.text) return part;
    });
    const toolCalls = response.candidates?.[0]?.content?.parts?.filter((part: Part) => {
        if (part.functionCall) return part;
    });
    const finishReason = response.candidates?.[0]?.finishReason;
    const usageMetadata = response.usageMetadata;

    const getThinking = () => thinkingBlocks?.map(block => 'content' in block ? block.content : '').join('\n');
    const hasThinking = () => thinkingBlocks?.length && thinkingBlocks.length > 0 || false;

    return {
        ...response,
        thinking: thinkingBlocks,
        content: regularContent,
        toolCalls: toolCalls,
        getThinking: getThinking,
        hasThinking: hasThinking,
        finishReason: finishReason,
        usageMetadata: usageMetadata,
    };
}
