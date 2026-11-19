import { Router } from "express";
import { overviewController } from "../controllers/evaluation.controller";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();
router.get("/overview", requireAuth, overviewController);

export default router;