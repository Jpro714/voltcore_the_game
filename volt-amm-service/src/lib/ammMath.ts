import Decimal from 'decimal.js';

Decimal.set({ precision: 40, rounding: Decimal.ROUND_HALF_UP });

const BASIS_POINTS = new Decimal(10000);

export const toDecimal = (value: Decimal.Value): Decimal => new Decimal(value);

const calculatePriceImpact = (
  oldCred: Decimal,
  oldToken: Decimal,
  newCred: Decimal,
  newToken: Decimal,
): Decimal => {
  if (oldToken.eq(0) || newToken.eq(0)) {
    return new Decimal(0);
  }
  const oldPrice = oldCred.div(oldToken);
  const newPrice = newCred.div(newToken);
  return newPrice.minus(oldPrice).div(oldPrice).abs();
};

export interface TradeComputationResult {
  tokensDelta: Decimal;
  credDelta: Decimal;
  feePaid: Decimal;
  spotPriceBefore: Decimal;
  spotPriceAfter: Decimal;
  priceImpact: Decimal;
  newCredReserve: Decimal;
  newTokenReserve: Decimal;
}

const feeAdjustedAmount = (amount: Decimal, feeBps: number): { amountAfterFee: Decimal; feePaid: Decimal } => {
  const feeFactor = BASIS_POINTS.minus(feeBps).div(BASIS_POINTS);
  const amountAfterFee = amount.mul(feeFactor);
  return {
    amountAfterFee,
    feePaid: amount.minus(amountAfterFee),
  };
};

export const computeBuyTrade = (
  credInput: Decimal,
  credReserve: Decimal,
  tokenReserve: Decimal,
  feeBps: number,
): TradeComputationResult => {
  if (credInput.lte(0)) throw new Error('credInput must be positive');
  if (credReserve.lte(0) || tokenReserve.lte(0)) {
    throw new Error('Pool reserves must be positive');
  }

  const { amountAfterFee, feePaid } = feeAdjustedAmount(credInput, feeBps);
  const numerator = amountAfterFee.mul(tokenReserve);
  const denominator = credReserve.add(amountAfterFee);
  const tokensOut = numerator.div(denominator);
  const newCredReserve = credReserve.add(credInput);
  const newTokenReserve = tokenReserve.sub(tokensOut);

  if (tokensOut.lte(0)) {
    throw new Error('Resulting token output is not positive');
  }

  const priceImpact = calculatePriceImpact(
    credReserve,
    tokenReserve,
    newCredReserve,
    newTokenReserve,
  );

  return {
    tokensDelta: tokensOut,
    credDelta: credInput.negated(),
    feePaid,
    spotPriceBefore: credReserve.div(tokenReserve),
    spotPriceAfter: newCredReserve.div(newTokenReserve),
    priceImpact,
    newCredReserve,
    newTokenReserve,
  };
};

export const computeSellTrade = (
  tokenInput: Decimal,
  credReserve: Decimal,
  tokenReserve: Decimal,
  feeBps: number,
): TradeComputationResult => {
  if (tokenInput.lte(0)) throw new Error('tokenInput must be positive');
  if (credReserve.lte(0) || tokenReserve.lte(0)) {
    throw new Error('Pool reserves must be positive');
  }

  const { amountAfterFee, feePaid } = feeAdjustedAmount(tokenInput, feeBps);
  const numerator = amountAfterFee.mul(credReserve);
  const denominator = tokenReserve.add(amountAfterFee);
  const credOut = numerator.div(denominator);
  const newCredReserve = credReserve.sub(credOut);
  const newTokenReserve = tokenReserve.add(tokenInput);

  if (credOut.lte(0)) {
    throw new Error('Resulting cred output is not positive');
  }

  const priceImpact = calculatePriceImpact(
    credReserve,
    tokenReserve,
    newCredReserve,
    newTokenReserve,
  );

  return {
    tokensDelta: tokenInput.negated(),
    credDelta: credOut,
    feePaid,
    spotPriceBefore: credReserve.div(tokenReserve),
    spotPriceAfter: newCredReserve.div(newTokenReserve),
    priceImpact,
    newCredReserve,
    newTokenReserve,
  };
};

export const calculateSharesForDeposit = (
  credAmount: Decimal,
  tokenAmount: Decimal,
  totalShares: Decimal,
  credReserve: Decimal,
  tokenReserve: Decimal,
): Decimal => {
  if (credAmount.lte(0) || tokenAmount.lte(0)) {
    throw new Error('Deposit amounts must be positive');
  }

  if (totalShares.eq(0)) {
    return credAmount.mul(tokenAmount).sqrt();
  }

  if (credReserve.eq(0) || tokenReserve.eq(0)) {
    throw new Error('Pool reserves cannot be zero when shares exist');
  }

  const sharesFromCred = credAmount.mul(totalShares).div(credReserve);
  const sharesFromToken = tokenAmount.mul(totalShares).div(tokenReserve);
  return Decimal.min(sharesFromCred, sharesFromToken);
};

export const calculateWithdrawalForShares = (
  sharesToBurn: Decimal,
  totalShares: Decimal,
  credReserve: Decimal,
  tokenReserve: Decimal,
): { credOut: Decimal; tokenOut: Decimal } => {
  if (sharesToBurn.lte(0)) throw new Error('Shares to burn must be positive');
  if (totalShares.lte(0)) throw new Error('No liquidity in pool');

  const shareRatio = sharesToBurn.div(totalShares);
  return {
    credOut: credReserve.mul(shareRatio),
    tokenOut: tokenReserve.mul(shareRatio),
  };
};
