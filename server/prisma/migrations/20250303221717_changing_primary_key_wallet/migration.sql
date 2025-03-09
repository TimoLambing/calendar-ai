/*
  Warnings:

  - The primary key for the `Wallet` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `Wallet` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Snapshot" DROP CONSTRAINT "Snapshot_walletId_fkey";

-- DropForeignKey
ALTER TABLE "TradingDiaryEntry" DROP CONSTRAINT "TradingDiaryEntry_walletId_fkey";

-- DropForeignKey
ALTER TABLE "WalletSnapshot" DROP CONSTRAINT "WalletSnapshot_walletId_fkey";

-- DropForeignKey
ALTER TABLE "_FollowRelation" DROP CONSTRAINT "_FollowRelation_A_fkey";

-- DropForeignKey
ALTER TABLE "_FollowRelation" DROP CONSTRAINT "_FollowRelation_B_fkey";

-- DropIndex
DROP INDEX "Wallet_address_key";

-- AlterTable
ALTER TABLE "Wallet" DROP CONSTRAINT "Wallet_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "Wallet_pkey" PRIMARY KEY ("address");

-- AddForeignKey
ALTER TABLE "TradingDiaryEntry" ADD CONSTRAINT "TradingDiaryEntry_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletSnapshot" ADD CONSTRAINT "WalletSnapshot_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Snapshot" ADD CONSTRAINT "Snapshot_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FollowRelation" ADD CONSTRAINT "_FollowRelation_A_fkey" FOREIGN KEY ("A") REFERENCES "Wallet"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FollowRelation" ADD CONSTRAINT "_FollowRelation_B_fkey" FOREIGN KEY ("B") REFERENCES "Wallet"("address") ON DELETE CASCADE ON UPDATE CASCADE;
