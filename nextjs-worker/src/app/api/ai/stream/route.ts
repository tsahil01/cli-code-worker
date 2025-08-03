import { NextRequest } from 'next/server';
import { chatValidation } from '@/types';
import { verifyUser } from '@/lib/auth';
import { aisdk } from '@/sdk/vercel-ai-sdk';
import { convertToModelMessages, UIMessage } from 'ai';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const zodValidation = chatValidation.safeParse(body);
        console.log(zodValidation);

        if (!zodValidation.success) {
            return new Response(
                JSON.stringify({ error: "zod_validation_error", details: zodValidation.error.message }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }
        const userData = await verifyUser(request);
        if (!userData) {
            return new Response(
                JSON.stringify({ error: "unauthorized" }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const { chat } = zodValidation.data;
        const { messages, sdk, model, temperature, plan, apiKey, provider } = chat;

        const coreMessages = convertToModelMessages(messages as UIMessage[]);

        return aisdk(coreMessages, model);

    } catch (error) {
        console.error("Error in /chat/stream endpoint:", error);
        return new Response(
            JSON.stringify({ error: "internal_server_error", details: error }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
} 