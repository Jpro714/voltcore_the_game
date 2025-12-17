const BASIS_POINTS = 10000;

const applyFee = (amount: number, feeBps: number) => amount * ((BASIS_POINTS - feeBps) / BASIS_POINTS);

export const estimateBuyOutput = (credInput: number, credReserve: number, tokenReserve: number, feeBps: number) => {
  if (credInput <= 0 || credReserve <= 0 || tokenReserve <= 0) return 0;
  const amountAfterFee = applyFee(credInput, feeBps);
  const tokensOut = (amountAfterFee * tokenReserve) / (credReserve + amountAfterFee);
  return Number.isFinite(tokensOut) ? tokensOut : 0;
};

export const estimateSellOutput = (
  tokenInput: number,
  credReserve: number,
  tokenReserve: number,
  feeBps: number,
) => {
  if (tokenInput <= 0 || credReserve <= 0 || tokenReserve <= 0) return 0;
  const amountAfterFee = applyFee(tokenInput, feeBps);
  const credOut = (amountAfterFee * credReserve) / (tokenReserve + amountAfterFee);
  return Number.isFinite(credOut) ? credOut : 0;
};
