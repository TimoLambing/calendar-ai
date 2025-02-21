import {
  Wallet, InsertWallet,
  PortfolioSnapshot, InsertPortfolioSnapshot,
  CoinBalance, InsertCoinBalance,
  Transaction, InsertTransaction
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private wallets: Map<string, Wallet>;
  private snapshots: Map<number, PortfolioSnapshot>;
  private coinBalances: Map<number, CoinBalance[]>;
  private transactions: Map<number, Transaction[]>;
  private currentId: number;

  constructor() {
    this.wallets = new Map();
    this.snapshots = new Map();
    this.coinBalances = new Map();
    this.transactions = new Map();
    this.currentId = 1;
  }

  async getWallet(address: string): Promise<Wallet | undefined> {
    return Array.from(this.wallets.values()).find(w => w.address === address);
  }

  async createWallet(wallet: InsertWallet): Promise<Wallet> {
    const id = this.currentId++;
    const newWallet: Wallet = { ...wallet, id };
    this.wallets.set(wallet.address, newWallet);
    return newWallet;
  }

  async createSnapshot(snapshot: InsertPortfolioSnapshot): Promise<PortfolioSnapshot> {
    const id = this.currentId++;
    const newSnapshot: PortfolioSnapshot = { ...snapshot, id };
    this.snapshots.set(id, newSnapshot);
    return newSnapshot;
  }

  async getSnapshots(walletId: number): Promise<PortfolioSnapshot[]> {
    return Array.from(this.snapshots.values()).filter(s => s.walletId === walletId);
  }

  async addCoinBalance(balance: InsertCoinBalance): Promise<CoinBalance> {
    const id = this.currentId++;
    const newBalance: CoinBalance = { ...balance, id };
    const existingBalances = this.coinBalances.get(balance.snapshotId) || [];
    this.coinBalances.set(balance.snapshotId, [...existingBalances, newBalance]);
    return newBalance;
  }

  async getCoinBalances(snapshotId: number): Promise<CoinBalance[]> {
    return this.coinBalances.get(snapshotId) || [];
  }

  async addTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentId++;
    const newTransaction: Transaction = { ...transaction, id };
    const existingTransactions = this.transactions.get(transaction.walletId) || [];
    this.transactions.set(transaction.walletId, [...existingTransactions, newTransaction]);
    return newTransaction;
  }

  async getTransactions(walletId: number): Promise<Transaction[]> {
    return this.transactions.get(walletId) || [];
  }
}

export const storage = new MemStorage();
