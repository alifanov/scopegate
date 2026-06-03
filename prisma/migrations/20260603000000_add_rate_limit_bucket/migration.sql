-- CreateTable
CREATE TABLE "rate_limit_bucket" (
    "endpointId" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "rate_limit_bucket_pkey" PRIMARY KEY ("endpointId","windowStart")
);
