-- AlterTable
ALTER TABLE "ServiceConnection" ADD COLUMN "consecutiveFailures" INTEGER NOT NULL DEFAULT 0;
