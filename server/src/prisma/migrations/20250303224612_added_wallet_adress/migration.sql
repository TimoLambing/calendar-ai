/*
  Warnings:

  - You are about to drop the column `walletId` on the `Snapshot` table. All the data in the column will be lost.
  - You are about to drop the column `walletId` on the `TradingDiaryEntry` table. All the data in the column will be lost.
  - You are about to drop the column `walletId` on the `WalletSnapshot` table. All the data in the column will be lost.
  - You are about to drop the `_FollowRelation` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `walletAddress` to the `Snapshot` table without a default value. This is not possible if the table is not empty.
  - Added the required column `walletAddress` to the `TradingDiaryEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `walletAddress` to the `WalletSnapshot` table without a default value. This is not possible if the table is not empty.

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

-- AlterTable
ALTER TABLE "Snapshot" DROP COLUMN "walletId",
ADD COLUMN     "walletAddress" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TradingDiaryEntry" DROP COLUMN "walletId",
ADD COLUMN     "walletAddress" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "WalletSnapshot" DROP COLUMN "walletId",
ADD COLUMN     "walletAddress" TEXT NOT NULL;

-- DropTable
DROP TABLE "_FollowRelation";

-- CreateTable
CREATE TABLE "_WalletFollows" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_WalletFollows_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_WalletFollows_B_index" ON "_WalletFollows"("B");

-- AddForeignKey
ALTER TABLE "TradingDiaryEntry" ADD CONSTRAINT "TradingDiaryEntry_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "Wallet"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletSnapshot" ADD CONSTRAINT "WalletSnapshot_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "Wallet"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Snapshot" ADD CONSTRAINT "Snapshot_walletAddress_fkey" FOREIGN KEY ("walletAddress") REFERENCES "Wallet"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WalletFollows" ADD CONSTRAINT "_WalletFollows_A_fkey" FOREIGN KEY ("A") REFERENCES "Wallet"("address") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WalletFollows" ADD CONSTRAINT "_WalletFollows_B_fkey" FOREIGN KEY ("B") REFERENCES "Wallet"("address") ON DELETE CASCADE ON UPDATE CASCADE;
