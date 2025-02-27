import { Router } from "express";
import { prisma } from "../prisma/prisma";
import { z } from "zod";

const router = Router();

// Schema for creating diary entries
const createDiaryEntrySchema = z.object({
  comment: z.string(),
  timestamp: z.string(), // or 'Date', but typically sent as string
  portfolioValue: z.number(),
  valueChange: z.number(),
  walletId: z.string(),
  authorAddress: z.string(),
});

// Schema for creating comments
const createCommentSchema = z.object({
  comment: z.string(),
  authorAddress: z.string(),
});

// 1) Get all diary entries
router.get("/diary-entries", async (_req, res) => {
  try {
    const entries = await prisma.tradingDiaryEntry.findMany({
      include: { comments: true },
      orderBy: { timestamp: "desc" },
    });
    res.json(entries);
  } catch (error) {
    console.error("Error fetching diary entries:", error);
    res.status(500).json({ error: "Failed to fetch diary entries" });
  }
});

// 2) Get diary entries for a specific date
router.get("/diary-entries/date/:date", async (req, res) => {
  try {
    // parse date from param
    const day = new Date(req.params.date);
    // define start and end of that day
    const startOfDay = new Date(day);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(day);
    endOfDay.setHours(23, 59, 59, 999);

    const entries = await prisma.tradingDiaryEntry.findMany({
      where: {
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: { comments: true },
      orderBy: { timestamp: "desc" },
    });
    res.json(entries);
  } catch (error) {
    console.error("Error fetching diary entries by date:", error);
    res.status(500).json({ error: "Failed to fetch diary entries" });
  }
});

// 3) Create a new diary entry
router.post("/diary-entries", async (req, res) => {
  try {
    const data = createDiaryEntrySchema.parse(req.body);

    // Validate wallet existence or connect
    // If you need to ensure the wallet is in the DB, do connectOrCreate here:
    const wallet = await prisma.wallet.upsert({
      where: { address: data.walletId },
      update: {},
      create: { address: data.walletId },
    });

    const entry = await prisma.tradingDiaryEntry.create({
      data: {
        comment: data.comment,
        timestamp: new Date(data.timestamp),
        portfolioValue: data.portfolioValue,
        valueChange: data.valueChange,
        authorAddress: data.authorAddress,
        walletId: wallet.id,
      },
      include: { comments: true },
    });

    res.json(entry);
  } catch (error) {
    console.error("Error creating diary entry:", error);
    res.status(500).json({ error: "Failed to create diary entry" });
  }
});

// 4) Get comments for a diary entry
router.get("/diary-entries/:entryId/comments", async (req, res) => {
  try {
    const comments = await prisma.tradingDiaryComment.findMany({
      where: { entryId: req.params.entryId },
      orderBy: { createdAt: "desc" },
    });
    res.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

// 5) Add a comment to a diary entry
router.post("/diary-entries/:entryId/comments", async (req, res) => {
  try {
    const { comment, authorAddress } = createCommentSchema.parse(req.body);
    const entryId = req.params.entryId;

    const newComment = await prisma.tradingDiaryComment.create({
      data: {
        comment,
        authorAddress,
        entryId,
      },
    });

    res.json(newComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

export default router;
