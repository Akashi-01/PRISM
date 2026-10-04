import { Router } from "express";
import {
  analyzeController,
  listController,
  getByIdController,
} from "../controllers/prompt.controller";

const router = Router();

router.post("/analyze", analyzeController);
router.get("/", listController);
router.get("/:id", getByIdController);

export default router;