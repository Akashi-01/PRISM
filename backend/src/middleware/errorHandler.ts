import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { LLMError } from "../services/llm/GeminiProvider";

// Turn any thrown error into a safe, user-facing AppError
function toAppError(err: any): AppError {
  if (err instanceof AppError) return err;

  if (err instanceof LLMError) {
    const cause: any = err.cause;
    if (cause?.name === "TimeoutError") {
      return new AppError("The AI model took too long to respond. Please try again.", 504, "LLM_TIMEOUT");
    }
    if (Number(cause?.status) === 429) {
      return new AppError("The AI service is busy right now. Wait a moment and try again.", 429, "LLM_RATE_LIMIT");
    }
    if (/invalid|validation|empty/i.test(err.message)) {
      return new AppError("The AI returned an unusable response. Please try again.", 502, "LLM_BAD_OUTPUT");
    }
    return new AppError("The AI service is unavailable. Please try again shortly.", 502, "LLM_ERROR");
  }

  // Malformed JSON body from express.json()
  if (err?.type === "entity.parse.failed") {
    return new AppError("Request body is not valid JSON.", 400, "INVALID_JSON");
  }

  // Prisma errors (pool timeout, connection refused, etc.)
  if (typeof err?.clientVersion === "string" || String(err?.name).startsWith("PrismaClient")) {
    return new AppError("Database error. Could not complete the request.", 503, "DATABASE_ERROR");
  }

  return new AppError("Something went wrong on the server.", 500, "INTERNAL_ERROR");
}

export function errorHandler(err: any, _req: Request, res: Response, next: NextFunction) {
  console.error("[error]", err); // full details stay in the server log only
  if (res.headersSent) return next(err);

  const appErr = toAppError(err);
  res.status(appErr.statusCode).json({
    success: false,
    error: appErr.message,
    code: appErr.code,
  });
}