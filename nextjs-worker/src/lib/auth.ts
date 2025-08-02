import { UserData } from "../types";
import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";

export async function verifyUser(req: NextRequest): Promise<UserData | null> {
    try {
        let access_token = req.headers.get("authorization")?.split(" ")[1];
        if (!access_token) {
            return null;
        }
        access_token = access_token.replace("vibe_", "");
        const decoded = await jwt.verify(access_token, process.env.JWT_SECRET as string)
        if (!decoded) {
            return null;
        }

        const userData = decoded as UserData;
        const currentDate = new Date();

        if ((userData.subscriptions[0].status !== "ACTIVE" && userData.subscriptions[0].status !== "TRIAL") || (new Date(userData.subscriptions[0].nextPeriodStart) < currentDate)) {
            return null;
        }
        return userData;
    } catch (error) {
        console.error("Error in verifyUser:", error);
        return null;
    }
}