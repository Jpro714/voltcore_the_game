-- Add optional twitterUserId to wallets so we can map Volt Twitter personas to balances
ALTER TABLE "Wallet" ADD COLUMN "twitterUserId" TEXT;

CREATE UNIQUE INDEX "Wallet_twitterUserId_key" ON "Wallet"("twitterUserId");
