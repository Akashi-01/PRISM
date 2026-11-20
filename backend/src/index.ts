import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { env } from "./config/env";
import authRoutes from "./routes/auth.routes";
import promptRoutes from "./routes/prompt.routes";
import evaluationRoutes from "./routes/evaluation.routes";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
app.set("trust proxy", 1);
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", project: "PRISM" });
});

app.use("/api/auth", authRoutes);
app.use("/api/prompts", promptRoutes);
app.use("/api/evaluation", evaluationRoutes);
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});