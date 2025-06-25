import { GoogleGenAI, Content } from "@google/genai";
import { anthropicTools } from "../context/tools";

const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


async function geminiChat(messages: Content[], model: string, max_tokens: number, thinking: boolean) {
    const response = await geminiClient.models.generateContent({
        model,
        contents: messages,
        config: {
            systemInstruction: "You are a helpful assistant.",
            thinkingConfig: {
                thinkingBudget: thinking ? 1000 : 0,
            },
            responseMimeType: "application/json",
            responseSchema: {
                type: "object",
                properties: {
                    answer: { type: "string" },
                },
            },
            tools:[{
                functionDeclarations: anthropicTools
            }]
        },
    });
    return response.text;
}



// // Check for function calls in the response
// if (response.functionCalls && response.functionCalls.length > 0) {
//     const functionCall = response.functionCalls[0]; // Assuming one function call
//     console.log(`Function to call: ${functionCall.name}`);
//     console.log(`Arguments: ${JSON.stringify(functionCall.args)}`);
//     // In a real app, you would call your actual function here:
//     // const result = await getCurrentTemperature(functionCall.args);
//   } else {
//     console.log("No function call found in the response.");
//     console.log(response.text);
//   }