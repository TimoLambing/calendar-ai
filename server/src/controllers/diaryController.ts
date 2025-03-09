// server/src/controllers/diaryController.ts

import { prisma } from "../prisma/prisma";
import { Request, Response } from "express";

/**
 * getDiaryEntries
 * Controller for GET /diary-entries
 * Fetches all diary entries
 */
export async function getDiaryEntries(_req: Request, res: Response) {
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
}

/**
 * getDiaryEntriesByDate
 * Controller for GET /diary-entries/date/:date
 * Fetch diary entries for a specific date
 */
export async function getDiaryEntriesByDate(req: Request, res: Response) {
  try {
    const day = new Date(req.params.date);
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
}

/**
 * createDiaryEntry
 * Controller for POST /api/diary-entries
 * Creates a new diary entry
 */
export async function createDiaryEntry(req: Request, res: Response) {
  try {
    const {
      comment,
      timestamp,
      portfolioValue,
      valueChange,
      authorAddress,
      wallet, // Match the field sent in the request
    } = req.body;

    // Validate required fields
    if (
      !comment ||
      !timestamp ||
      !portfolioValue ||
      !valueChange ||
      !authorAddress ||
      !wallet
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Ensure wallet is a string (assuming walletData is an address)
    const walletAddress = typeof wallet === "string" ? wallet : wallet.address;
    if (!walletAddress) {
      return res.status(400).json({ error: "Invalid wallet address" });
    }

    // Upsert the wallet
    const walletRecord = await prisma.wallet.upsert({
      where: { address: walletAddress },
      update: {},
      create: { address: walletAddress },
    });

    // Create the diary entry
    const entry = await prisma.tradingDiaryEntry.create({
      data: {
        comment,
        timestamp: new Date(timestamp),
        portfolioValue,
        valueChange,
        authorAddress,
        walletAddress: walletRecord.address, // Use walletAddress as per schema
      },
      include: { comments: true },
    });

    return res.json(entry);
  } catch (error) {
    console.error("Error creating diary entry:", error);
    return res.status(500).json({ error: "Failed to create diary entry" });
  }
}
/**
 * getDiaryComments
 * Controller for GET /diary-entries/:entryId/comments
 * Fetches all comments for a specific diary entry
 */
export async function getDiaryComments(req: Request, res: Response) {
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
}

/**
 * addDiaryComment
 * Controller for POST /diary-entries/:entryId/comments
 * Adds a new comment to a specific diary entry
 */
export async function addDiaryComment(req: Request, res: Response) {
  try {
    const { comment, authorAddress } = req.body;
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
}
