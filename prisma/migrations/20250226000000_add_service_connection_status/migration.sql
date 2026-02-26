-- AlterTable
ALTER TABLE "ServiceConnection" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "ServiceConnection" ADD COLUMN "lastError" TEXT;
