// server/src/storage.ts

import { prisma } from "./prisma/prisma";

// The storage interface is now implemented directly in the routes
// using Prisma client. This file is kept for reference of the
// data models and operations supported by the application.

export interface IStorage {
  // Wallet operations
  getWallet(address: string): Promise<any>;
  createWallet(wallet: any): Promise<any>;

  // Portfolio operations
  createSnapshot(snapshot: any): Promise<any>;
  getSnapshots(walletId: string): Promise<any[]>;

  // Coin balance operations
  addCoinBalance(balance: any): Promise<any>;
  getCoinBalances(snapshotId: string): Promise<any[]>;

  // Transaction operations
  addTransaction(transaction: any): Promise<any>;
  getTransactions(walletId: string): Promise<any[]>;

  // Trading diary operations
  addDiaryEntry(entry: any): Promise<any>;
  getDiaryEntriesByDate(date: Date): Promise<any[]>;
  getAllDiaryEntries(): Promise<any[]>;

  // Comment operations
  addDiaryComment(comment: any): Promise<any>;
  getDiaryComments(entryId: string): Promise<any[]>;
}

// Export prisma instance for direct usage in routes
export { prisma };
