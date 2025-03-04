/*************************************************
 * server/src/services/ethereumService.ts (UPDATED)
 *
 * Purpose:
 * 1) Provide named functions for Ethereum wallet
 *    data fetching, matching your import style.
 *************************************************/

import { ethers } from "ethers";
import { config } from "../config/environment-config";

/**
 * Fetch Ethereum wallet data via Alchemy
 */
export async function fetchEthereumData(walletAddress: string) {
  try {
    const baseUrl = `https://eth-mainnet.g.alchemy.com/v2/${config.ALCHEMY_API_KEY}`;

    // For transactions
    const txListUrl = `${baseUrl}?module=account&action=txlist&address=${walletAddress}`;
    const txRes = await fetch(txListUrl);
    const txData = await txRes.json();

    // For token balances
    const balanceRes = await fetch(`${baseUrl}/alchemy_getTokenBalances`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "alchemy_getTokenBalances",
        params: [walletAddress],
        id: 1,
      }),
    });
    const balances = await balanceRes.json();

    return {
      transactions: txData.result || [],
      tokenBalances: balances.result?.tokenBalances || [],
    };
  } catch (error) {
    console.error("Error fetching Ethereum data:", error);
    return null;
  }
}

/**
 * Etherscan-based fetch for wallet transactions
 */
export async function fetchEtherWalletTransactions(walletAddress: string) {
  try {
    const url = new URL("https://api.etherscan.io/v2/api");

    url.searchParams.append("chainid", "1");
    url.searchParams.append("module", "account");
    url.searchParams.append("action", "txlist");
    url.searchParams.append("address", walletAddress);
    url.searchParams.append("tag", "latest");
    url.searchParams.append("apikey", config.ETHERSCAN_API_KEY);

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.log(error);
    return null;
  }
}
