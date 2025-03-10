/*
  Warnings:

  - A unique constraint covering the columns `[walletAddress,timestamp]` on the table `WalletSnapshot` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "WalletSnapshot_walletAddress_timestamp_key" ON "WalletSnapshot"("walletAddress", "timestamp");
