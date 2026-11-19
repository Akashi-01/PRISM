import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { registerSchema, loginSchema } from "../validators/auth.schema";
import { registerUser, loginUser, getUserById } from "../services/authService";

export async function registerController(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request",
        details: z.flattenError(parsed.error).fieldErrors,
      });
    }

    const result = await registerUser(parsed.data);
    if ("error" in result) {
      return res.status(409).json({ success: false, error: "Email already registered" });
    }
    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request",
        details: z.flattenError(parsed.error).fieldErrors,
      });
    }

    const result = await loginUser(parsed.data);
    if ("error" in result) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function meController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getUserById(req.user!.id);
    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid or expired token" });
    }
    return res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}