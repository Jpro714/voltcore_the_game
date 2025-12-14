-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "twitterUserId" TEXT NOT NULL,
    "twitterHandle" TEXT NOT NULL,
    "persona" JSONB NOT NULL,
    "cadenceMinutes" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterState" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "currentSituation" TEXT,
    "workingMemory" TEXT,
    "lastActivationAt" TIMESTAMP(3),
    "nextActivationAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "CharacterState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterActivation" (
    "id" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inputContext" JSONB,
    "actions" JSONB,
    "summary" TEXT,

    CONSTRAINT "CharacterActivation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Character_handle_key" ON "Character"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterState_characterId_key" ON "CharacterState"("characterId");

-- CreateIndex
CREATE INDEX "CharacterActivation_characterId_occurredAt_idx" ON "CharacterActivation"("characterId", "occurredAt");

-- AddForeignKey
ALTER TABLE "CharacterState" ADD CONSTRAINT "CharacterState_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterActivation" ADD CONSTRAINT "CharacterActivation_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
