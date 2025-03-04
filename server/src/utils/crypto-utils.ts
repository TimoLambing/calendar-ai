// server/src/utils/crypto-utils.ts

import { ethers } from "ethers";
import { EthereumTransaction } from "../types/shared-types";

/**
 * Decodes a transaction and returns a structured summary
 * @param tx - Transaction data
 * @param contractAbi - Optional ABI for decoding contract interactions
 * @returns Human-readable transaction summary
 */
export function decodeTransaction(
  tx: EthereumTransaction,
  contractAbi?: string[]
): string {
  let summary = `Transaction Hash: ${tx.hash}\n`;
  summary += `From: ${tx.from}\nTo: ${tx.to}\n`;

  // Convert ETH value from wei
  const ethValue = ethers.formatEther(tx.value);
  if (tx.value !== "0") {
    summary += `Transferred: ${ethValue} ETH\n`;
  }

  // Handle ERC-20 or contract interactions
  if (tx.input !== "0x" && tx.methodId !== "0x") {
    if (tx.methodId.startsWith("0xa9059cbb")) {
      // ERC-20 transfer function (transfer(address,uint256))
      try {
        const iface = new ethers.Interface([
          "function transfer(address to, uint256 amount)",
        ]);
        const decoded = iface.parseTransaction({ data: tx.input });

        const recipient = decoded?.args[0];
        const amount = decoded?.args[1].toString();

        summary += `ERC-20 Transfer: ${amount} tokens to ${recipient}\n`;
      } catch {
        summary += "Failed to decode ERC-20 transfer\n";
      }
    } else if (contractAbi) {
      // Decode custom contract interaction
      try {
        const iface = new ethers.Interface(contractAbi);
        const decoded = iface.parseTransaction({ data: tx.input });

        summary += `Function: ${decoded?.name}\nArguments: ${JSON.stringify(
          decoded?.args,
          null,
          2
        )}\n`;
      } catch {
        summary += "Failed to decode contract interaction\n";
      }
    } else {
      summary += `Contract Interaction: ${tx.functionName} (Method ID: ${tx.methodId})\n`;
    }
  }

  // Check transaction status
  summary += `Status: ${tx.isError === "1" ? "Failed ❌" : "Success ✅"}\n`;

  return summary;
}
