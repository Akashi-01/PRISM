import { Router } from "express";
import {
  analyzeController,
  listController,
  getByIdController,
  listStagesController,
  getStageController,
  answersController,
  rerunController,
  evaluateController,
  getEvaluationController,
} from "../controllers/prompt.controller";

const router = Router();

router.post("/analyze", analyzeController);
router.get("/", listController);
router.get("/:id", getByIdController);
router.get("/:id/stages", listStagesController);
router.get("/:id/stages/:stageName", getStageController);
router.post("/:id/answers", answersController);
router.post("/:id/rerun", rerunController);
router.post("/:id/evaluate", evaluateController);
router.get("/:id/evaluation", getEvaluationController);

export default router;