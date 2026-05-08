-- CreateTable
CREATE TABLE "invite_token" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invite_token_token_key" ON "invite_token"("token");
