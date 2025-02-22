import Web3 from 'web3';
import { apiRequest } from './queryClient';
import { DayData } from './mockData';
import { Log } from 'web3-core';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface WalletConnection {
  address: string;
  balance: string;
}

export interface WalletTransaction {
  hash: string;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  tokenSymbol?: string;
  tokenAmount?: string;
}

export async function connectWallet(): Promise<WalletConnection> {
  if (!window.ethereum) {
    throw new Error('No Web3 wallet found. Please install MetaMask.');
  }

  const web3 = new Web3(window.ethereum);

  try {
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });

    if (!accounts[0]) {
      throw new Error('No account found');
    }

    const balance = await web3.eth.getBalance(accounts[0]);

    try {
      await apiRequest('POST', '/api/wallets', {
        address: accounts[0],
        lastSync: new Date().toISOString()
      });
    } catch (error: any) {
      if (!error.message.includes('duplicate key')) {
        throw error;
      }
    }

    return {
      address: accounts[0],
      balance: web3.utils.fromWei(balance, 'ether')
    };
  } catch (error: any) {
    throw new Error('Failed to connect wallet: ' + error.message);
  }
}

export async function getWalletHistory(address: string, fromBlock?: number): Promise<DayData[]> {
  if (!window.ethereum) {
    throw new Error('No Web3 wallet found');
  }

  const web3 = new Web3(window.ethereum);

  try {
    const latestBlock = await web3.eth.getBlockNumber();
    // Convert to number for arithmetic operation
    const startBlock = fromBlock || Math.max(0, Number(latestBlock) - 10000);

    const transactions = await web3.eth.getPastLogs({
      fromBlock: BigInt(startBlock),
      toBlock: 'latest',
      address: address
    });

    const dayMap = new Map<string, DayData>();

    await Promise.all(transactions.map(async (tx: Log) => {
      if (!tx.blockNumber || !tx.transactionHash) return;

      const block = await web3.eth.getBlock(Number(tx.blockNumber));
      if (!block || !block.timestamp) return;

      const date = new Date(Number(block.timestamp) * 1000);
      const dateKey = date.toISOString().split('T')[0];

      const transaction = await web3.eth.getTransaction(tx.transactionHash);
      if (!transaction || !transaction.value) return;

      const value = web3.utils.fromWei(transaction.value, 'ether');

      if (!dayMap.has(dateKey)) {
        dayMap.set(dateKey, {
          date: new Date(dateKey),
          totalValue: 0,
          coins: [],
          transactions: [],
          notes: ''
        });
      }

      const dayData = dayMap.get(dateKey)!;
      const txValue = parseFloat(value);
      dayData.totalValue += txValue;

      dayData.transactions.push({
        id: tx.transactionHash,
        walletId: 1,
        timestamp: date,
        type: transaction.from.toLowerCase() === address.toLowerCase() ? 'SELL' : 'BUY',
        symbol: 'ETH',
        amount: value,
        valueUsd: value,
        currentValue: value
      });
    }));

    return Array.from(dayMap.values()).sort((a, b) => 
      b.date.getTime() - a.date.getTime()
    );
  } catch (error: any) {
    console.error('Error fetching wallet history:', error);
    throw new Error('Failed to fetch wallet history: ' + error.message);
  }
}

// Get ERC20 token balances (to be enhanced)
export async function getWalletTokens(address: string) {
  // This would call a service like Etherscan or Alchemy
  // to get token balances. Will be implemented later.
  return [];
}