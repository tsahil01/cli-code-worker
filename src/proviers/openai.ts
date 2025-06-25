import OpenAI from "openai";
import { Message } from "openai/resources/beta/threads/messages";

const openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function openaiChat(messages: Message[], model: string, max_tokens: number, thinking: boolean) {
    try {
        const response = await openaiClient.responses.create({
            model,
            input: messages,
            max_output_tokens: max_tokens,
            ...(thinking && {
                thinking: {
                    type: "enabled",
                    budget_tokens: 1000,
                }
            }),
            text: { format: { type: "json_object" } }
        });

        // Check if the conversation was too long for the context window, resulting in incomplete JSON 
        if (response.status === "incomplete" && response.incomplete_details?.reason === "max_output_tokens") {
            // your code should handle this error case
        }

        // Check if the OpenAI safety system refused the request and generated a refusal instead
        const firstOutput = response.output[0];
        if (firstOutput.type === "message" && firstOutput.content?.[0]?.type === "refusal") {
            // your code should handle this error case
            // In this case, the .content field will contain the explanation (if any) that the model generated for why it is refusing
        }

        // Check if the model's output included restricted content, so the generation of JSON was halted and may be partial
        if (response.status === "incomplete" && response.incomplete_details?.reason === "content_filter") {
            // your code should handle this error case
        }

        if (response.status === "completed") {
            // In this case the model has either successfully finished generating the JSON object according to your schema, or the model generated one of the tokens you provided as a "stop token"

            if (true) { // No stop tokens specified
                // If you didn't specify any stop tokens, then the generation is complete and the content key will contain the serialized JSON object
                // This will parse successfully and should now contain  {"winner": "Los Angeles Dodgers"}
                console.log(JSON.parse(response.output_text))
            } else {
                // Check if the response.output_text ends with one of your stop tokens and handle appropriately
            }
        }
    } catch (e) {
        // Your code should handle errors here, for example a network error calling the API
        console.error(e)
    }
}