// client/src/lib/utils.ts

import { z } from "zod";
// import type { Prisma } from "@prisma/client";

// // Export Prisma types
// export type Wallet = Prisma.WalletGetPayload<{}>;
// export type TradingDiaryEntry = Prisma.TradingDiaryEntryGetPayload<{}>;
// export type TradingDiaryComment = Prisma.TradingDiaryCommentGetPayload<{}>;
// export type WalletSnapshot = Prisma.WalletSnapshotGetPayload<{}>;
// export type CoinBalance = Prisma.CoinBalanceGetPayload<{}>;
// export type Transaction = Prisma.TransactionGetPayload<{}>;

// Zod schemas for validation
export const walletSchema = z.object({
  address: z.string().min(1, "Wallet address is required"),
});

export const tradingDiaryEntrySchema = z.object({
  comment: z.string(),
  timestamp: z.string(),
  portfolioValue: z.number(),
  valueChange: z.number(),
  walletId: z.string(),
  authorAddress: z.string(),
});

export const tradingDiaryCommentSchema = z.object({
  comment: z.string(),
  authorAddress: z.string(),
  entryId: z.string(),
});

export const coinBalanceSchema = z.object({
  id: z.string(),
  snapshotId: z.string(),
  symbol: z.string(),
  amount: z.string(),
  valueUsd: z.string(),
});

export const transactionSchema = z.object({
  id: z.string(),
  walletId: z.string(),
  timestamp: z.date(),
  symbol: z.string(),
  type: z.string(),
  amount: z.string(),
  valueUsd: z.string(),
  currentValue: z.string().optional(),
});

// Types for insert operations
export type InsertWallet = z.infer<typeof walletSchema>;
export type InsertTradingDiaryEntry = z.infer<typeof tradingDiaryEntrySchema>;
export type InsertTradingDiaryComment = z.infer<
  typeof tradingDiaryCommentSchema
>;
export type InsertCoinBalance = z.infer<typeof coinBalanceSchema>;
export type InsertTransaction = z.infer<typeof transactionSchema>;
export type CoinBalance = z.infer<typeof coinBalanceSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
