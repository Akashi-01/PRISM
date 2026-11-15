import { Router } from "express";
import { overviewController } from "../controllers/evaluation.controller";

const router = Router();
router.get("/overview", overviewController);

export default router;