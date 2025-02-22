import { pgTable, text, serial, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Existing tables remain unchanged
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  address: text("address").notNull().unique(),
  lastSync: timestamp("last_sync").default(sql`CURRENT_TIMESTAMP`),
});

export const portfolioSnapshots = pgTable("portfolio_snapshots", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").references(() => wallets.id),
  timestamp: timestamp("timestamp").notNull(),
  totalValue: decimal("total_value").notNull(),
});

export const coinBalances = pgTable("coin_balances", {
  id: serial("id").primaryKey(),
  snapshotId: integer("snapshot_id").references(() => portfolioSnapshots.id),
  symbol: text("symbol").notNull(),
  amount: decimal("amount").notNull(),
  valueUsd: decimal("value_usd").notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").references(() => wallets.id),
  timestamp: timestamp("timestamp").notNull(),
  type: text("type").notNull(),
  symbol: text("symbol").notNull(),
  amount: decimal("amount").notNull(),
  valueUsd: decimal("value_usd").notNull(),
  currentValue: decimal("current_value"), 
});

// Update trading diary entries with author information
export const tradingDiaryEntries = pgTable("trading_diary_entries", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").references(() => wallets.id).notNull(),
  authorAddress: text("author_address").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  portfolioValue: decimal("portfolio_value"),
  valueChange: decimal("value_change"),
});

// New table for comments on trading diary entries
export const tradingDiaryComments = pgTable("trading_diary_comments", {
  id: serial("id").primaryKey(),
  entryId: integer("entry_id").references(() => tradingDiaryEntries.id).notNull(),
  authorAddress: text("author_address").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertWalletSchema = createInsertSchema(wallets).extend({
  address: z.string().min(1, "Wallet address is required"),
});

export const insertPortfolioSnapshotSchema = createInsertSchema(portfolioSnapshots);
export const insertCoinBalanceSchema = createInsertSchema(coinBalances);
export const insertTransactionSchema = createInsertSchema(transactions);
export const insertTradingDiaryEntrySchema = createInsertSchema(tradingDiaryEntries);
export const insertTradingDiaryCommentSchema = createInsertSchema(tradingDiaryComments);

export type Wallet = typeof wallets.$inferSelect;
export type PortfolioSnapshot = typeof portfolioSnapshots.$inferSelect;
export type CoinBalance = typeof coinBalances.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type TradingDiaryEntry = typeof tradingDiaryEntries.$inferSelect;
export type TradingDiaryComment = typeof tradingDiaryComments.$inferSelect;

export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type InsertPortfolioSnapshot = z.infer<typeof insertPortfolioSnapshotSchema>;
export type InsertCoinBalance = z.infer<typeof insertCoinBalanceSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertTradingDiaryEntry = z.infer<typeof insertTradingDiaryEntrySchema>;
export type InsertTradingDiaryComment = z.infer<typeof insertTradingDiaryCommentSchema>;