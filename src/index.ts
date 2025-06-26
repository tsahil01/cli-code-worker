import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes";
dotenv.config();

const PORT = process.env.PORT || 3000;
export const anthropicAPIKey = process.env.ANTHROPIC_API_KEY;
export const openAIAPIKey = process.env.OPENAI_API_KEY;
export const geminiAPIKey = process.env.GEMINI_API_KEY;

const app = express();

app.use(express.json());
app.use(cors())

app.use("/api/v1", router);

app.get("/", (req, res) => {
  res.send("Well, This is a worker server.");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});