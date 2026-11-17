import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  analyzeRequestSchema,
  rerunRequestSchema,
  stageNameSchema,
} from "../validators/prompt.schema";
import { AnswersBodySchema, type MissingInfoStored } from "../schemas/stages.schema";
import { runPipeline, rerunPipeline } from "../services/promptPipeline";
import type { Clarification } from "../pipeline/types";
import { prisma } from "../lib/prisma";
import { evaluateSession } from "../evaluation/evaluateSession";
import { isProviderAvailable } from "../services/llm";

function parseId(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// requireAuth always runs before these controllers
function userIdOf(req: Request): number {
  return req.user!.id;
}

// true only if the session exists AND belongs to this user
async function ownsSession(id: number, userId: number): Promise<boolean> {
  const row = await prisma.promptSession.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  return row !== null;
}

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

    const { prompt, provider } = parsed.data;

    // the chosen provider must have an API key on the server
    if (provider && !isProviderAvailable(provider)) {
      return res.status(400).json({
        success: false,
        error: `${provider} is not configured on the server`,
      });
    }

    const userId = userIdOf(req);
    const session = await runPipeline(prompt, provider);
    await prisma.promptSession.update({ where: { id: session.id }, data: { userId } });
    return res.status(201).json({ success: true, data: { ...session, userId } });
  } catch (err) {
    next(err);
  }
}

export async function listController(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await prisma.promptSession.findMany({
      where: {
        userId: userIdOf(req),
        optimizedPrompt: { not: null },
        experimentItems: { none: {} },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getByIdController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, error: "Invalid id" });
    }
    const userId = userIdOf(req);

    const data = await prisma.promptSession.findFirst({
      where: { id, userId },
      include: { stages: { where: { isCurrent: true }, orderBy: { id: "asc" } } },
    });
    if (!data) {
      return res.status(404).json({ success: false, error: "Not found" });
    }

    const runNumber = await prisma.promptSession.count({
      where: {
        userId,
        optimizedPrompt: { not: null },
        experimentItems: { none: {} },
        id: { lte: id },
      },
    });

    res.json({ success: true, data: Object.assign({}, data, { runNumber }) });
  } catch (err) {
    next(err);
  }
}

// GET /:id/stages            -> current stage results
// GET /:id/stages?history=true -> every run, including superseded rows
export async function listStagesController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, error: "Invalid id" });
    }

    const session = await prisma.promptSession.findFirst({
      where: { id, userId: userIdOf(req) },
      select: { id: true, currentRun: true },
    });
    if (!session) {
      return res.status(404).json({ success: false, error: "Not found" });
    }

    const history = req.query.history === "true";
    const stages = await prisma.stageResult.findMany({
      where: { sessionId: id, ...(history ? {} : { isCurrent: true }) },
      orderBy: { id: "asc" },
    });

    res.json({
      success: true,
      data: { sessionId: id, currentRun: session.currentRun, stages },
    });
  } catch (err) {
    next(err);
  }
}

// GET /:id/stages/:stageName -> one current stage result
export async function getStageController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, error: "Invalid id" });
    }
    const stageName = stageNameSchema.safeParse(req.params.stageName);
    if (!stageName.success) {
      return res.status(400).json({ success: false, error: "Unknown stage" });
    }
    if (!(await ownsSession(id, userIdOf(req)))) {
      return res.status(404).json({ success: false, error: "Not found" });
    }

    const stage = await prisma.stageResult.findFirst({
      where: { sessionId: id, stage: stageName.data, isCurrent: true },
      orderBy: { id: "desc" },
    });
    if (!stage) {
      return res.status(404).json({ success: false, error: "Not found" });
    }
    res.json({ success: true, data: stage });
  } catch (err) {
    next(err);
  }
}

// POST /:id/answers  body: { answers: [{ questionId, answer }] }
// Send ALL answers each time; the saved answers are replaced.
export async function answersController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, error: "Invalid id" });
    }

    const parsed = AnswersBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request",
        details: z.flattenError(parsed.error).fieldErrors,
      });
    }

    const session = await prisma.promptSession.findFirst({
      where: { id, userId: userIdOf(req) },
    });
    if (!session) {
      return res.status(404).json({ success: false, error: "Not found" });
    }

    const missing = await prisma.stageResult.findFirst({
      where: { sessionId: id, stage: "missingInfo", isCurrent: true, status: "success" },
      orderBy: { id: "desc" },
    });
    const items = ((missing?.output as MissingInfoStored | undefined)?.items ?? []) as any[];
    // old runs have no ids, so fall back to the position (q1, q2, ...)
    const questions = new Map<string, string>(
      items.map((it, i) => [it.id ?? `q${i + 1}`, it.question as string])
    );

    const unknown = parsed.data.answers.filter((a) => !questions.has(a.questionId));
    if (unknown.length) {
      return res.status(400).json({
        success: false,
        error: "Unknown questionId",
        details: unknown.map((a) => a.questionId),
      });
    }

    const clarifications: Clarification[] = parsed.data.answers
      .filter((a) => a.answer)
      .map((a) => ({
        questionId: a.questionId,
        question: questions.get(a.questionId)!,
        answer: a.answer,
      }));
    if (!clarifications.length) {
      return res.status(400).json({
        success: false,
        error: "Provide at least one non-empty answer",
      });
    }

    const data = await rerunPipeline(id, { fromStage: "optimize", clarifications });
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// POST /:id/rerun  body: { fromStage }
export async function rerunController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, error: "Invalid id" });
    }

    const parsed = rerunRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request",
        details: z.flattenError(parsed.error).fieldErrors,
      });
    }
    if (!(await ownsSession(id, userIdOf(req)))) {
      return res.status(404).json({ success: false, error: "Not found" });
    }

    const data = await rerunPipeline(id, { fromStage: parsed.data.fromStage });
    if (!data) {
      return res.status(404).json({ success: false, error: "Not found" });
    }
    return res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

// POST /:id/evaluate
export async function evaluateController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: "Invalid id" });
    if (!(await ownsSession(id, userIdOf(req)))) {
      return res.status(404).json({ success: false, error: "Not found" });
    }

    const result = await evaluateSession(id);
    if ("error" in result) {
      return result.error === "not_found"
        ? res.status(404).json({ success: false, error: "Not found" })
        : res.status(409).json({ success: false, error: "Run has no optimized prompt yet" });
    }
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

// GET /:id/evaluation
export async function getEvaluationController(req: Request, res: Response, next: NextFunction) {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: "Invalid id" });
    if (!(await ownsSession(id, userIdOf(req)))) {
      return res.status(404).json({ success: false, error: "Not found" });
    }

    const summary = await prisma.evaluationSummary.findFirst({
      where: { sessionId: id, isCurrent: true },
      orderBy: { id: "desc" },
    });
    if (!summary) return res.status(404).json({ success: false, error: "No evaluation yet" });

    const responses = await prisma.responseEvaluation.findMany({
      where: { sessionId: id, isCurrent: true },
      orderBy: { id: "asc" },
    });
    res.json({ success: true, data: { summary, responses } });
  } catch (err) {
    next(err);
  }
}