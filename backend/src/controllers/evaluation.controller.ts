import type { Request, Response, NextFunction } from "express";
import { getEvaluationOverview } from "../services/evaluationOverview";

export async function overviewController(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getEvaluationOverview();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}