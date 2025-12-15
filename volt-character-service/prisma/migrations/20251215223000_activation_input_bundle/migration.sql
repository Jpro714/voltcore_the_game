-- Add optional JSON column to record the bundle sent to the LLM for each activation
ALTER TABLE "CharacterActivation"
ADD COLUMN "inputBundle" JSONB;
