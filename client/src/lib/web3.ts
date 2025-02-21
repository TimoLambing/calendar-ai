import Web3 from 'web3';
import { apiRequest } from './queryClient';

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
    // Request account access
    const accounts = await window.ethereum.request({ 
      method: 'eth_requestAccounts' 
    });

    if (!accounts[0]) {
      throw new Error('No account found');
    }

    const balance = await web3.eth.getBalance(accounts[0]);

    // Register wallet with our backend
    try {
      await apiRequest('POST', '/api/wallets', {
        address: accounts[0],
        lastSync: new Date().toISOString()
      });
    } catch (error: any) {
      // If the wallet already exists, that's fine - continue
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

export async function getWalletTokens(address: string) {
  // This would typically call a service like Etherscan or Alchemy
  // to get token balances. Simplified for demo.
  return [];
}