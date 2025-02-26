// server/routes/diary.ts

import { Router } from "express";
import { prisma } from "../prisma";
import { z } from "zod";

const router = Router();

// Schema for diary entry creation
const createDiaryEntrySchema = z.object({
  comment: z.string(),
  timestamp: z.string(),
  portfolioValue: z.number(),
  valueChange: z.number(),
  walletId: z.string(),
  authorAddress: z.string(),
});

// Get all diary entries
router.get("/diary-entries", async (req, res) => {
  try {
    const entries = await prisma.tradingDiaryEntry.findMany({
      include: {
        comments: true,
      },
      orderBy: {
        timestamp: "desc",
      },
    });
    res.json(entries);
  } catch (error) {
    console.error("Error fetching diary entries:", error);
    res.status(500).json({ error: "Failed to fetch diary entries" });
  }
});

// Get diary entries by date
router.get("/diary-entries/date/:date", async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const entries = await prisma.tradingDiaryEntry.findMany({
      where: {
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        comments: true,
      },
      orderBy: {
        timestamp: "desc",
      },
    });
    res.json(entries);
  } catch (error) {
    console.error("Error fetching diary entries by date:", error);
    res.status(500).json({ error: "Failed to fetch diary entries" });
  }
});

// Create a new diary entry
router.post("/diary-entries", async (req, res) => {
  try {
    const data = createDiaryEntrySchema.parse(req.body);

    // Create the entry
    const entry = await prisma.tradingDiaryEntry.create({
      data: {
        comment: data.comment,
        timestamp: new Date(data.timestamp),
        portfolioValue: data.portfolioValue,
        valueChange: data.valueChange,
        wallet: {
          connectOrCreate: {
            where: { address: data.authorAddress },
            create: { address: data.authorAddress },
          },
        },
        authorAddress: data.authorAddress,
      },
      include: {
        comments: true,
      },
    });

    res.json(entry);
  } catch (error) {
    console.error("Error creating diary entry:", error);
    res.status(500).json({ error: "Failed to create diary entry" });
  }
});

// Add comment to a diary entry
router.post("/diary-entries/:entryId/comments", async (req, res) => {
  try {
    const { comment, authorAddress } = req.body;
    const entryId = req.params.entryId;

    const newComment = await prisma.tradingDiaryComment.create({
      data: {
        comment,
        authorAddress,
        entry: {
          connect: { id: entryId },
        },
      },
    });

    res.json(newComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
});

export default router;
