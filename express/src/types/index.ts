import { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { Content } from "@google/genai";
import { ResponseInputItem } from "openai/resources/responses/responses";
import { z } from "zod";

export interface AnthropicFunctionCall {
    type: 'tool_use';
    id: string;
    name: string;
    input?: Record<string, any>;
}

export interface GeminiFunctionCall {
    type?: 'tool_use';
    id?: string;
    thoughtSignature?: string;
    functionCall: {
        name: string;
        args?: Record<string, any>;
    };
}

export interface OpenAIFunctionCall {
    type: 'tool_use';
    id: string;
    function: {
        name: string;
        arguments?: Record<string, any>;
    };
    index?: number;
}

export type FunctionCall = AnthropicFunctionCall | GeminiFunctionCall | OpenAIFunctionCall;


export interface MessageMetadata {
    thinkingContent?: string;
    thinkingSignature?: string;
    toolCalls?: FunctionCall[];
    finishReason?: string;
    usageMetadata?: any;
}

export const msgSchema = z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.any(),
    isError: z.boolean().optional(),
    ignoreInLLM: z.boolean().optional(),
    ignoreInDisplay: z.boolean().optional(),
    thinking: z.boolean().optional(),
    metadata: z.object({
        thinkingContent: z.string().optional(),
        thinkingSignature: z.string().optional(),
        toolCalls: z.array(z.any()).optional(),
        finishReason: z.string().optional(),
        usageMetadata: z.any().optional(),
    }).optional(),

})

export const planModeSchema = z.enum(["lite", "full"]);

export const addOnSchema = z.enum(["memory", "github", "advanced-context"]);

export const planSchema = z.object({
    mode: planModeSchema,
    addOns: z.array(addOnSchema).optional(),
})

export const chatSchema = z.object({
    messages: z.array(msgSchema),
    sdk: z.enum(["openai", "anthropic", "gemini", "other"]),
    provider: z.string(),
    base_url: z.string().url().optional(),
    model: z.string(),
    temperature: z.number().min(0).max(1).optional(),
    max_tokens: z.number().optional(),
    plan: planSchema,
    apiKey: z.string(),
})

export const chatValidation = z.object({
    chat: chatSchema,
})
export interface Subscription {
    id: string;
    planId: string;
    status: string;
    currentPeriodStart: string;
    nextPeriodStart: string;
}

export interface UserData {
    email: string;
    type: string;
    tokenId: string;
    subscriptions: Subscription[];
}

export interface ModelCapabilities {
    modelName: string;
    provider: string;
    displayName: string;
    maxInputTokens: number; // maximum input tokens (context window)
    maxOutputTokens: number; // maximum output tokens
    thinking: boolean;
    minThinkingTokens?: number;
    maxThinkingTokens?: number;
    baseUrl?: string;
    sdk: "anthropic" | "openai" | "gemini";
    apiKeyName: `${string}_API_KEY`;
}

export interface GeminiInput extends Content { };

export interface AnthropicInput extends MessageParam { }

export type OpenAIInput = ResponseInputItem;

export interface ResponseUsageMetadata {
    cacheInputTokens: number;
    inputTokens: number;
    cacheReadTokens: number;
    outputTokens: number;
}