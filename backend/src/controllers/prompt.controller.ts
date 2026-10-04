import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { analyzeRequestSchema } from "../validators/prompt.schema";
import { runPipeline } from "../services/promptPipeline";
import { prisma } from "../lib/prisma";

export async function analyzeController(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = analyzeRequestSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request",
        details: z.flattenError(parsed.error).fieldErrors,
      });
    }

    const session = await runPipeline(parsed.data.prompt);
    return res.status(201).json({ success: true, data: session });
  } catch (err) {
    next(err);
  }
}

export async function listController(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await prisma.promptSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getByIdController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, error: "Invalid id" });
    }

    const data = await prisma.promptSession.findUnique({ where: { id } });
    if (!data) {
      return res.status(404).json({ success: false, error: "Not found" });
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}