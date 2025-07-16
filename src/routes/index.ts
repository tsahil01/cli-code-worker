import { Router } from "express";
import userRouter from "./user";
import modelRouter from "./model";
import chatRouter from "./chat";
const router = Router();

router.use("/user", userRouter);
router.use("/models", modelRouter);
router.use("/chat", chatRouter);

router.get("/", (req, res) => {
    res.send("Hello World");
});



export default router;