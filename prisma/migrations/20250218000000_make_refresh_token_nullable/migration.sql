-- AlterTable: make refreshToken nullable (matches Prisma schema `String?`)
ALTER TABLE "ServiceConnection" ALTER COLUMN "refreshToken" DROP NOT NULL;
