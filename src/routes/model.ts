import { Router } from "express";
import { anthropicModels, geminiModels, openaiModels, otherModels } from "../lib/models";

const router = Router();

router.get("/", async (req, res) => {
    const models = {
        anthropic: anthropicModels,
        openai: openaiModels,
        gemini: geminiModels,
        other: otherModels
    }
    res.status(200).json({ models });
});

router.get('/available', async (req, res) => {
    const models = {
        anthropic: anthropicModels,
        openai: openaiModels,
        gemini: geminiModels,
        other: otherModels
    }
    res.status(200).json({ models });
});

export default router;