import { NextResponse } from 'next/server';
import { anthropicModels, geminiModels, openaiModels, otherModels } from '@/lib/models';

export async function GET() {
    const models = {
        anthropic: anthropicModels,
        openai: openaiModels,
        gemini: geminiModels,
        other: otherModels
    }
    return NextResponse.json({ models });
} 