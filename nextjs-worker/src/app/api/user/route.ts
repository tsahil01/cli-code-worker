import { NextRequest, NextResponse } from 'next/server';
import { verifyUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const userData = await verifyUser(request);
        if (!userData) {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        }

        return NextResponse.json(userData);
    } catch (error) {
        console.error("Error in /user endpoint:", error);
        return NextResponse.json({ error: "internal_server_error", details: error }, { status: 500 });
    }
} 