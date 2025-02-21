import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertWalletSchema, insertPortfolioSnapshotSchema, insertTransactionSchema, insertTradingDiaryEntrySchema } from "@shared/schema";
import { ZodError } from "zod";

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Wallet routes
  app.post("/api/wallets", async (req, res) => {
    try {
      const result = insertWalletSchema.safeParse(req.body);
      if (!result.success) {
        console.error("Wallet validation error:", result.error);
        return res.status(400).json({ error: result.error.issues });
      }
      const wallet = await storage.createWallet(result.data);
      res.json(wallet);
    } catch (error) {
      console.error("Error creating wallet:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ error: error.issues });
      }
      // Handle duplicate wallet address gracefully
      if (error.message.includes('duplicate key')) {
        const existingWallet = await storage.getWallet(req.body.address);
        return res.json(existingWallet);
      }
      res.status(500).json({ error: "Failed to create wallet" });
    }
  });

  app.get("/api/wallets/:address", async (req, res) => {
    try {
      const wallet = await storage.getWallet(req.params.address);
      if (!wallet) {
        return res.status(404).json({ error: "Wallet not found" });
      }
      res.json(wallet);
    } catch (error) {
      console.error("Error fetching wallet:", error);
      res.status(500).json({ error: "Failed to fetch wallet" });
    }
  });

  // Portfolio routes
  app.post("/api/snapshots", async (req, res) => {
    try {
      const result = insertPortfolioSnapshotSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.issues });
      }
      const snapshot = await storage.createSnapshot(result.data);
      res.json(snapshot);
    } catch (error) {
      console.error("Error creating snapshot:", error);
      res.status(500).json({ error: "Failed to create snapshot" });
    }
  });

  app.get("/api/wallets/:walletId/snapshots", async (req, res) => {
    try {
      const snapshots = await storage.getSnapshots(parseInt(req.params.walletId));
      res.json(snapshots);
    } catch (error) {
      console.error("Error fetching snapshots:", error);
      res.status(500).json({ error: "Failed to fetch snapshots" });
    }
  });

  // Transaction routes
  app.post("/api/transactions", async (req, res) => {
    try {
      const result = insertTransactionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.issues });
      }
      const transaction = await storage.addTransaction(result.data);
      res.json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  app.get("/api/wallets/:walletId/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactions(parseInt(req.params.walletId));
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // New Trading Diary routes
  app.post("/api/diary-entries", async (req, res) => {
    try {
      const result = insertTradingDiaryEntrySchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.issues });
      }
      const entry = await storage.addDiaryEntry(result.data);
      res.json(entry);
    } catch (error) {
      console.error("Error creating diary entry:", error);
      res.status(500).json({ error: "Failed to create diary entry" });
    }
  });

  app.get("/api/transactions/:transactionId/diary-entries", async (req, res) => {
    try {
      const entries = await storage.getDiaryEntries(parseInt(req.params.transactionId));
      res.json(entries);
    } catch (error) {
      console.error("Error fetching diary entries:", error);
      res.status(500).json({ error: "Failed to fetch diary entries" });
    }
  });

  app.get("/api/diary-entries", async (req, res) => {
    try {
      const entries = await storage.getAllDiaryEntries();
      res.json(entries);
    } catch (error) {
      console.error("Error fetching all diary entries:", error);
      res.status(500).json({ error: "Failed to fetch diary entries" });
    }
  });

  return httpServer;
}