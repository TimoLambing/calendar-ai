import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertWalletSchema, insertPortfolioSnapshotSchema, insertTransactionSchema } from "@shared/schema";

export async function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Wallet routes
  app.post("/api/wallets", async (req, res) => {
    const result = insertWalletSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const wallet = await storage.createWallet(result.data);
    res.json(wallet);
  });

  app.get("/api/wallets/:address", async (req, res) => {
    const wallet = await storage.getWallet(req.params.address);
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }
    res.json(wallet);
  });

  // Portfolio routes
  app.post("/api/snapshots", async (req, res) => {
    const result = insertPortfolioSnapshotSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const snapshot = await storage.createSnapshot(result.data);
    res.json(snapshot);
  });

  app.get("/api/wallets/:walletId/snapshots", async (req, res) => {
    const snapshots = await storage.getSnapshots(parseInt(req.params.walletId));
    res.json(snapshots);
  });

  // Transaction routes
  app.post("/api/transactions", async (req, res) => {
    const result = insertTransactionSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    const transaction = await storage.addTransaction(result.data);
    res.json(transaction);
  });

  app.get("/api/wallets/:walletId/transactions", async (req, res) => {
    const transactions = await storage.getTransactions(parseInt(req.params.walletId));
    res.json(transactions);
  });

  return httpServer;
}
