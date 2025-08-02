import { UserData } from "../types";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";

export async function verifyUser(req: Request, res: Response): Promise<UserData | null> {
    try {
        let access_token = req.headers.authorization?.split(" ")[1];
        if (!access_token) {
            res.status(401).json({ error: "no_access_token" })
            return null;
        }
        access_token = access_token.replace("vibe_", "");
        const decoded = await jwt.verify(access_token, process.env.JWT_SECRET as string)
        if (!decoded) {
            res.status(401).json({ error: "invalid_access_token" })
            return null;
        }

        const userData = decoded as UserData;
        const currentDate = new Date();

        if ((userData.subscriptions[0].status !== "ACTIVE" && userData.subscriptions[0].status !== "TRIAL") || (new Date(userData.subscriptions[0].nextPeriodStart) < currentDate)) {
            res.status(403).json({ error: "subscription_not_active" })
            return null;
        }
        return userData;
    } catch (error) {
        console.error("Error in verifyUser:", error);
        res.status(401).json({ error: "invalid_access_token", details: error })
        return null;
    }
}