// server/src/routes/diaryRoutes.ts

import { Router } from "express";
import {
  getDiaryEntries,
  getDiaryEntriesByDate,
  createDiaryEntry,
  getDiaryComments,
  addDiaryComment,
} from "../controllers/diaryController";

const router = Router();

router.get("/diary-entries", getDiaryEntries);
router.get("/diary-entries/date/:date", getDiaryEntriesByDate);
router.post("/diary-entries", createDiaryEntry);
router.get("/diary-entries/:entryId/comments", getDiaryComments);
router.post("/diary-entries/:entryId/comments", addDiaryComment);

export default router;
