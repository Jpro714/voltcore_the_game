-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('PLAYER', 'CHARACTER', 'SYSTEM', 'STORY');

-- CreateEnum
CREATE TYPE "TradeType" AS ENUM ('BUY', 'SELL');

-- CreateEnum
CREATE TYPE "LiquidityEventType" AS ENUM ('ADD', 'REMOVE');

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "handle" TEXT,
    "type" "WalletType" NOT NULL DEFAULT 'PLAYER',
    "credBalance" DECIMAL(30,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VentureToken" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "totalSupply" DECIMAL(30,6) NOT NULL DEFAULT 0,
    "circulatingSupply" DECIMAL(30,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creatorWalletId" TEXT,

    CONSTRAINT "VentureToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidityPool" (
    "id" TEXT NOT NULL,
    "ventureTokenId" TEXT NOT NULL,
    "credReserve" DECIMAL(30,6) NOT NULL DEFAULT 0,
    "tokenReserve" DECIMAL(30,6) NOT NULL DEFAULT 0,
    "totalShares" DECIMAL(30,6) NOT NULL DEFAULT 0,
    "feeBasisPoints" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiquidityPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidityPosition" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "shares" DECIMAL(30,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiquidityPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "TradeType" NOT NULL,
    "credDelta" DECIMAL(30,6) NOT NULL,
    "tokenDelta" DECIMAL(30,6) NOT NULL,
    "price" DECIMAL(30,6) NOT NULL,
    "feePaid" DECIMAL(30,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidityEvent" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" "LiquidityEventType" NOT NULL,
    "shares" DECIMAL(30,6) NOT NULL,
    "credDelta" DECIMAL(30,6) NOT NULL,
    "tokenDelta" DECIMAL(30,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiquidityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenHolding" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "amount" DECIMAL(30,6) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenHolding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_handle_key" ON "Wallet"("handle");

-- CreateIndex
CREATE UNIQUE INDEX "VentureToken_symbol_key" ON "VentureToken"("symbol");

-- CreateIndex
CREATE UNIQUE INDEX "LiquidityPool_ventureTokenId_key" ON "LiquidityPool"("ventureTokenId");

-- CreateIndex
CREATE UNIQUE INDEX "LiquidityPosition_poolId_walletId_key" ON "LiquidityPosition"("poolId", "walletId");

-- CreateIndex
CREATE UNIQUE INDEX "TokenHolding_walletId_tokenId_key" ON "TokenHolding"("walletId", "tokenId");

-- AddForeignKey
ALTER TABLE "VentureToken" ADD CONSTRAINT "VentureToken_creatorWalletId_fkey" FOREIGN KEY ("creatorWalletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidityPool" ADD CONSTRAINT "LiquidityPool_ventureTokenId_fkey" FOREIGN KEY ("ventureTokenId") REFERENCES "VentureToken"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidityPosition" ADD CONSTRAINT "LiquidityPosition_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "LiquidityPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidityPosition" ADD CONSTRAINT "LiquidityPosition_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "LiquidityPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidityEvent" ADD CONSTRAINT "LiquidityEvent_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "LiquidityPool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidityEvent" ADD CONSTRAINT "LiquidityEvent_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenHolding" ADD CONSTRAINT "TokenHolding_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenHolding" ADD CONSTRAINT "TokenHolding_tokenId_fkey" FOREIGN KEY ("tokenId") REFERENCES "VentureToken"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
