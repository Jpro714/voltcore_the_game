-- Add cadence range columns and migrate existing data
ALTER TABLE "Character" ADD COLUMN "cadenceMinMinutes" INTEGER;
ALTER TABLE "Character" ADD COLUMN "cadenceMaxMinutes" INTEGER;

UPDATE "Character"
SET
  "cadenceMinMinutes" = COALESCE("cadenceMinutes", 5),
  "cadenceMaxMinutes" = COALESCE("cadenceMinutes", 15);

ALTER TABLE "Character" DROP COLUMN "cadenceMinutes";

-- Create ping queue table for direct mentions/DMs
CREATE TABLE "CharacterPing" (
  "id" TEXT NOT NULL,
  "characterId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "consumedAt" TIMESTAMP(3),
  CONSTRAINT "CharacterPing_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CharacterPing_characterId_createdAt_idx" ON "CharacterPing"("characterId", "createdAt");

ALTER TABLE "CharacterPing"
  ADD CONSTRAINT "CharacterPing_characterId_fkey"
  FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
