// server/src/types/shared-types.ts
// Blockchain types
export type BlockchainType = "ethereum" | "solana";

// Wallet data
export interface WalletData {
  id: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

// Transaction related types
export interface Transaction {
  symbol: string;
  type: string;
  amount: number;
  valueUsd: number;
  timestamp: Date;
}

export interface TokenBalance {
  symbol: string;
  decimals?: string;
  tokenBalance?: string;
}

export interface WalletSnapshot {
  id: string;
  timestamp: Date;
  totalValue: number;
  walletId: string;
  balances: CoinBalance[];
  transactions: Transaction[];
}

export interface CoinBalance {
  symbol: string;
  amount: number;
  valueUsd: number;
  timestamp: Date;
}

// Ethereum related types
export interface EthereumTransaction {
  blockNumber: string;
  blockHash: string;
  timeStamp: string;
  hash: string;
  nonce: string;
  transactionIndex: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  input: string;
  methodId: string;
  functionName: string;
  contractAddress: string;
  cumulativeGasUsed: string;
  txreceipt_status: string;
  gasUsed: string;
  confirmations: string;
  isError: string;
}

// Trading diary related types
export interface DiaryEntry {
  comment: string;
  timestamp: Date;
  portfolioValue: number;
  valueChange: number;
  authorAddress: string;
  walletId: string;
}

export interface DiaryComment {
  comment: string;
  authorAddress: string;
  entryId: string;
}
