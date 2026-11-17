import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../services/authService";

declare global {
  namespace Express {
    interface Request {
      user?: { id: number };
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "Authentication required" });
  }

  const userId = verifyToken(header.slice(7));
  if (!userId) {
    return res.status(401).json({ success: false, error: "Invalid or expired token" });
  }

  req.user = { id: userId };
  next();
}