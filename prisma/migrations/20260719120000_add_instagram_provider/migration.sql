-- Add Instagram to the ServiceProvider enum (Instagram API with Instagram Login).
-- Non-destructive: appends a value, no data touched. Placed BEFORE googleTagManager
-- to match the enum order in schema.prisma and avoid future drift detection.
ALTER TYPE "ServiceProvider" ADD VALUE IF NOT EXISTS 'instagram' BEFORE 'googleTagManager';
