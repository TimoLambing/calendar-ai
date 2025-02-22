import Web3 from 'web3';
import { apiRequest } from './queryClient';
import { DayData } from './mockData';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export interface WalletConnection {
  address: string;
  balance: string;
}

export async function connectWallet(): Promise<WalletConnection> {
  if (!window.ethereum) {
    throw new Error('No Web3 wallet found. Please install MetaMask.');
  }

  const web3 = new Web3(window.ethereum);

  try {
    // Request both account access and transaction history permissions
    const permissions = await window.ethereum.request({ 
      method: 'wallet_requestPermissions',
      params: [{
        eth_accounts: {},
        eth_blockNumber: {},
        eth_call: {},
        eth_getBalance: {},
        eth_getBlockByNumber: {},
        eth_getTransactionByHash: {},
        eth_getLogs: {}
      }]
    });

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
    if (error.code === 4001) {
      throw new Error('Permission denied. Please grant access to view your transaction history.');
    }
    throw new Error('Failed to connect wallet: ' + error.message);
  }
}

// For now, we'll use mock data until we have proper permissions
export async function getWalletHistory(address: string): Promise<DayData[]> {
  const generateMockData = (numDays: number): DayData[] => {
    const data: DayData[] = [];
    for (let i = 0; i < numDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date,
        totalValue: Math.random() * 100,
        coins: [],
        transactions: [],
        notes: ''
      });
    }
    return data;
  };
  return generateMockData(28);
}

// Get ERC20 token balances (to be enhanced)
export async function getWalletTokens(address: string) {
  // This would call a service like Etherscan or Alchemy
  // to get token balances. Will be implemented later.
  return [];
}