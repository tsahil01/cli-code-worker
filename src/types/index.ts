import { MessageParam } from "@anthropic-ai/sdk/resources/messages";
import { Content } from "@google/genai";
import { z } from "zod";

export const msgSchema = z.object({
    role: z.enum(["user", "assistant"]),
    content: z.any(),
})

export const planModeSchema = z.enum(["lite", "full"]);

export const addOnSchema = z.enum(["memory", "github", "advanced-context"]);

export const planSchema = z.object({
    mode: planModeSchema,
    addOns: z.array(addOnSchema).optional(),
})

export const chatSchema = z.object({
    messages: z.array(msgSchema),
    provider: z.enum(["openai", "anthropic", "gemini", "other"]),
    base_url: z.string().url().optional(),
    model: z.string(),
    temperature: z.number().min(0).max(1).optional(),
    max_tokens: z.number().optional(),
    plan: planSchema
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
    createdAt?: string;
}

export interface GeminiInput extends Content { };

export interface AnthropicInput extends MessageParam { }

export interface OpenAIInput {
    role: "user" | "assistant" | "system";
    content: string;
}