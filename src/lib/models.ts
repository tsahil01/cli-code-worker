import { ModelCapabilities } from "../types";

export const anthropicModels: ModelCapabilities[] = [{
    modelName: "claude-opus-4-20250514",
    provider: "anthropic",
    displayName: "Claude Opus 4",
    maxTokens: 200000,
    thinking: true,
    minThinkingTokens: 1024,
    maxThinkingTokens: 32000,
    createdAt: "2025-05-22T00:00:00Z"
}, {
    modelName: "claude-sonnet-4-20250514",
    provider: "anthropic",
    displayName: "Claude Sonnet 4",
    maxTokens: 200000,
    thinking: true,
    minThinkingTokens: 1024,
    maxThinkingTokens: 64000,
    createdAt: "2025-05-22T00:00:00Z"
}, {
    modelName: "claude-3-7-sonnet-20250219",
    provider: "anthropic",
    displayName: "Claude Sonnet 3.7",
    maxTokens: 200000,
    thinking: true,
    minThinkingTokens: 1024,
    maxThinkingTokens: 128000,
    createdAt: "2025-02-24T00:00:00Z"
}, {
    modelName: "claude-3-5-sonnet-20241022",
    provider: "anthropic",
    displayName: "Claude Sonnet 3.5 (New)",
    maxTokens: 100000,
    thinking: false,
    createdAt: "2024-10-22T00:00:00Z"
}, {
    modelName: "claude-3-5-haiku-20241022",
    provider: "anthropic",
    displayName: "Claude Haiku 3.5",
    maxTokens: 100000,
    thinking: false,
    createdAt: "2024-10-22T00:00:00Z"
}, {
    modelName: "claude-3-5-sonnet-20240620",
    provider: "anthropic",
    displayName: "Claude Sonnet 3.5 (Old)",
    maxTokens: 100000,
    thinking: false,
    createdAt: "2024-06-20T00:00:00Z"
}, {
    modelName: "claude-3-haiku-20240307",
    provider: "anthropic",
    displayName: "Claude Haiku 3",
    maxTokens: 100000,
    thinking: false,
    createdAt: "2024-03-07T00:00:00Z"
}, {
    modelName: "claude-3-opus-20240229",
    provider: "anthropic",
    displayName: "Claude Opus 3",
    maxTokens: 100000,
    thinking: false,
    createdAt: "2024-02-29T00:00:00Z"
}
];

export const openaiModels: ModelCapabilities[] = [{
    modelName: "o4-mini-20250416",
    provider: "openai",
    displayName: "OpenAI o4-mini",
    maxTokens: 128000,
    thinking: true,
    minThinkingTokens: 1024,
    maxThinkingTokens: 32000,
    createdAt: "2025-04-16T00:00:00Z"
}, {
    modelName: "o3-20250416",
    provider: "openai",
    displayName: "OpenAI o3",
    maxTokens: 128000,
    thinking: true,
    minThinkingTokens: 1024,
    maxThinkingTokens: 32000,
    createdAt: "2025-04-16T00:00:00Z"
}, {
    modelName: "o3-pro-20250416",
    provider: "openai",
    displayName: "OpenAI o3-pro",
    maxTokens: 128000,
    thinking: true,
    minThinkingTokens: 1024,
    maxThinkingTokens: 32000,
    createdAt: "2025-04-16T00:00:00Z"
}, {
    modelName: "o3-mini-20250416",
    provider: "openai",
    displayName: "OpenAI o3-mini",
    maxTokens: 64000,
    thinking: true,
    minThinkingTokens: 1024,
    maxThinkingTokens: 16000,
    createdAt: "2025-04-16T00:00:00Z"
}, {
    modelName: "o1-20240901",
    provider: "openai",
    displayName: "OpenAI o1",
    maxTokens: 64000,
    thinking: true,
    minThinkingTokens: 1024,
    maxThinkingTokens: 16000,
    createdAt: "2024-09-01T00:00:00Z"
}, {
    modelName: "gpt-4o-20240513",
    provider: "openai",
    displayName: "GPT-4o",
    maxTokens: 128000,
    thinking: false,
    createdAt: "2024-05-13T00:00:00Z"
}, {
    modelName: "gpt-4-1106-preview",
    provider: "openai",
    displayName: "GPT-4.1",
    maxTokens: 128000,
    thinking: false,
    createdAt: "2024-11-06T00:00:00Z"
}
];

export const geminiModels: ModelCapabilities[] = [{
    modelName: "gemini-2-5-pro-20250624",
    provider: "google",
    displayName: "Gemini 2.5 Pro",
    maxTokens: 128000,
    thinking: true,
    minThinkingTokens: 1024,
    maxThinkingTokens: 32000,
    createdAt: "2025-06-24T00:00:00Z"
}, {
    modelName: "gemini-2-0-flash-thinking-experimental-20250225",
    provider: "google",
    displayName: "Gemini 2.0 Flash Thinking Experimental",
    maxTokens: 64000,
    thinking: true,
    minThinkingTokens: 1024,
    maxThinkingTokens: 16000,
    createdAt: "2025-02-25T00:00:00Z"
}, {
    modelName: "gemini-1-5-pro-deep-research-20250225",
    provider: "google",
    displayName: "Gemini 1.5 Pro Deep Research",
    maxTokens: 128000,
    thinking: true,
    minThinkingTokens: 1024,
    maxThinkingTokens: 32000,
    createdAt: "2025-02-25T00:00:00Z"
}, {
    modelName: "gemini-1-0-pro-20231206",
    provider: "google",
    displayName: "Gemini 1.0 Pro",
    maxTokens: 32000,
    thinking: true,
    minThinkingTokens: 1024,
    maxThinkingTokens: 8000,
    createdAt: "2023-12-06T00:00:00Z"
}];
