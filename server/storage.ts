import {
  Wallet, InsertWallet,
  PortfolioSnapshot, InsertPortfolioSnapshot,
  CoinBalance, InsertCoinBalance,
  Transaction, InsertTransaction,
  TradingDiaryEntry, InsertTradingDiaryEntry,
  TradingDiaryComment, InsertTradingDiaryComment,
  wallets, portfolioSnapshots, coinBalances, transactions, tradingDiaryEntries, tradingDiaryComments
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { sql } from 'drizzle-orm';

export interface IStorage {
  // Wallet operations
  getWallet(address: string): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet): Promise<Wallet>;

  // Portfolio operations
  createSnapshot(snapshot: InsertPortfolioSnapshot): Promise<PortfolioSnapshot>;
  getSnapshots(walletId: number): Promise<PortfolioSnapshot[]>;

  // Coin balance operations
  addCoinBalance(balance: InsertCoinBalance): Promise<CoinBalance>;
  getCoinBalances(snapshotId: number): Promise<CoinBalance[]>;

  // Transaction operations
  addTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactions(walletId: number): Promise<Transaction[]>;

  // Trading diary operations
  addDiaryEntry(entry: InsertTradingDiaryEntry): Promise<TradingDiaryEntry>;
  getDiaryEntriesByDate(date: Date): Promise<TradingDiaryEntry[]>;
  getAllDiaryEntries(): Promise<TradingDiaryEntry[]>;

  // New comment operations
  addDiaryComment(comment: InsertTradingDiaryComment): Promise<TradingDiaryComment>;
  getDiaryComments(entryId: number): Promise<TradingDiaryComment[]>;
}

export class DatabaseStorage implements IStorage {
  async getWallet(address: string): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.address, address));
    return wallet;
  }

  async createWallet(wallet: InsertWallet): Promise<Wallet> {
    const [newWallet] = await db.insert(wallets).values(wallet).returning();
    return newWallet;
  }

  async createSnapshot(snapshot: InsertPortfolioSnapshot): Promise<PortfolioSnapshot> {
    const [newSnapshot] = await db.insert(portfolioSnapshots).values(snapshot).returning();
    return newSnapshot;
  }

  async getSnapshots(walletId: number): Promise<PortfolioSnapshot[]> {
    return db.select().from(portfolioSnapshots).where(eq(portfolioSnapshots.walletId, walletId));
  }

  async addCoinBalance(balance: InsertCoinBalance): Promise<CoinBalance> {
    const [newBalance] = await db.insert(coinBalances).values(balance).returning();
    return newBalance;
  }

  async getCoinBalances(snapshotId: number): Promise<CoinBalance[]> {
    return db.select().from(coinBalances).where(eq(coinBalances.snapshotId, snapshotId));
  }

  async addTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db.insert(transactions).values(transaction).returning();
    return newTransaction;
  }

  async getTransactions(walletId: number): Promise<Transaction[]> {
    return db.select().from(transactions).where(eq(transactions.walletId, walletId));
  }

  async addDiaryEntry(entry: InsertTradingDiaryEntry): Promise<TradingDiaryEntry> {
    const [newEntry] = await db.insert(tradingDiaryEntries).values(entry).returning();
    return newEntry;
  }

  async getDiaryEntriesByDate(date: Date): Promise<TradingDiaryEntry[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return db.select()
      .from(tradingDiaryEntries)
      .where(
        and(
          sql`${tradingDiaryEntries.timestamp} >= ${startOfDay.toISOString()}`,
          sql`${tradingDiaryEntries.timestamp} <= ${endOfDay.toISOString()}`
        )
      )
      .orderBy(desc(tradingDiaryEntries.createdAt));
  }

  async getAllDiaryEntries(): Promise<TradingDiaryEntry[]> {
    return db.select()
      .from(tradingDiaryEntries)
      .orderBy(desc(tradingDiaryEntries.timestamp));
  }

  async addDiaryComment(comment: InsertTradingDiaryComment): Promise<TradingDiaryComment> {
    const [newComment] = await db.insert(tradingDiaryComments).values(comment).returning();
    return newComment;
  }

  async getDiaryComments(entryId: number): Promise<TradingDiaryComment[]> {
    return db.select()
      .from(tradingDiaryComments)
      .where(eq(tradingDiaryComments.entryId, entryId))
      .orderBy(tradingDiaryComments.createdAt);
  }
}

export const storage = new DatabaseStorage();