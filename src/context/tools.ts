import { ToolUnion } from "@anthropic-ai/sdk/resources/messages";

export const anthropicTools: ToolUnion[] = [{
    name: "get_weather",
    description: "Get the current weather in a given location",
    input_schema: {
        type: "object",
        properties: {
            location: {
                type: "string",
                description: "The city and state, e.g. San Francisco, CA"
            }
        },
        required: ["location"]
    },
    cache_control: {
        type: "ephemeral"
    }
}]
