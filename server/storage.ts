import {
  Wallet, InsertWallet,
  PortfolioSnapshot, InsertPortfolioSnapshot,
  CoinBalance, InsertCoinBalance,
  Transaction, InsertTransaction,
  wallets, portfolioSnapshots, coinBalances, transactions
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();