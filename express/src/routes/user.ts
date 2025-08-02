import { Router } from "express";
import { verifyUser } from "../lib/auth";

const router = Router();

router.get("/", async (req, res) => {
    try {
        const userData = await verifyUser(req, res);;
        if (!userData) {
            return;
        }

        res.status(200).json(userData);
    } catch (error) {
        console.error("Error in /user endpoint:", error);
        res.status(500).json({ error: "internal_server_error", details: error });
    }
});

export default router;