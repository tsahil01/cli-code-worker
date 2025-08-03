import { createOpenAI } from "@ai-sdk/openai";
import { ModelMessage, streamObject, streamText } from "ai";
import { aisdkTools } from "@/context/tools";
const openai = createOpenAI({});

export async function aisdk(messages: ModelMessage[], model: string,) {

    const result = await streamText({
        model: openai(model),
        messages: messages,
        tools: aisdkTools,
        toolChoice: "auto",
    });

    return result.toUIMessageStream();
}