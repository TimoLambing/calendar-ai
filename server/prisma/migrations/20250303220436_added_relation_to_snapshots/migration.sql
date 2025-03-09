/*
  Warnings:

  - You are about to drop the `TokenSnapshot` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_WalletFollows` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TokenSnapshot" DROP CONSTRAINT "Snapshot_walletId_fkey";

-- DropForeignKey
ALTER TABLE "_WalletFollows" DROP CONSTRAINT "_WalletFollows_A_fkey";

-- DropForeignKey
ALTER TABLE "_WalletFollows" DROP CONSTRAINT "_WalletFollows_B_fkey";

-- DropTable
DROP TABLE "TokenSnapshot";

-- DropTable
DROP TABLE "_WalletFollows";

-- CreateTable
CREATE TABLE "Snapshot" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "totalValue" DOUBLE PRECISION NOT NULL,
    "symbol" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "name" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "thumbnail" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,

    CONSTRAINT "Snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FollowRelation" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FollowRelation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_FollowRelation_B_index" ON "_FollowRelation"("B");

-- AddForeignKey
ALTER TABLE "Snapshot" ADD CONSTRAINT "Snapshot_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FollowRelation" ADD CONSTRAINT "_FollowRelation_A_fkey" FOREIGN KEY ("A") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FollowRelation" ADD CONSTRAINT "_FollowRelation_B_fkey" FOREIGN KEY ("B") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
