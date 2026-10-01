import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { prisma } from "./lib/prisma";
import { env } from "./config/env";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// app.get("/api/health", (_req, res) => {
//   res.json({ status: "ok", project: "PRISM" });
// });

app.post("/api/prompts/test", async (_req, res) => {
  const row = await prisma.promptSession.create({
    data: { rawPrompt: "test prompt" },
  });
  res.json(row);
});

app.get("/api/prompts", async (_req, res) => {
  const rows = await prisma.promptSession.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(rows);
});

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});