DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "TeamMember"
    WHERE "role" NOT IN ('member', 'owner')
  ) THEN
    RAISE EXCEPTION 'Cannot migrate TeamMember.role to ProjectRole enum: found values outside member/owner';
  END IF;
END $$;

CREATE TYPE "ProjectRole" AS ENUM ('member', 'owner');

ALTER TABLE "TeamMember"
  ALTER COLUMN "role" DROP DEFAULT,
  ALTER COLUMN "role" TYPE "ProjectRole" USING ("role"::"ProjectRole"),
  ALTER COLUMN "role" SET DEFAULT 'member';
