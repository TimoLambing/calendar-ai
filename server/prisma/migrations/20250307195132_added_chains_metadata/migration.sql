-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "chains" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "currentChain" TEXT;
