import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  registerController,
  loginController,
  meController,
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many attempts, try again later" },
});

router.post("/register", authLimiter, registerController);
router.post("/login", authLimiter, loginController);
router.get("/me", requireAuth, meController);

export default router;