import { Router } from "express";
import { chatValidation, UserData } from "../types";
import { verifyUser } from "../lib/auth";

const router = Router();

router.get("/", (req, res) => {
    res.send("Hello World");
});

router.post("/chat", async (req, res) => {
    try {
        const zodValidation = chatValidation.safeParse(req.body)
        if (!zodValidation.success) {
            res.status(400).json({ error: "zod_validation_error", details: zodValidation.error.message })
            return;
        }
        const { chat } = zodValidation.data;
        const { messages, provider, base_url, model, temperature, max_tokens } = chat;

        const userData = await verifyUser(req, res);
        if (!userData) {
            return;
        }
        
        res.status(200).json({ message: "success" })
        return;

    } catch (error) {
        console.error("Error in /chat endpoint:", error);
        res.status(500).json({ error: "internal_server_error", details: error })
    }
});

export default router;