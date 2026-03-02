const EPSILON = 1e-9;

function toFiniteNumber(value, field) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`${field} must be a finite number`);
  }
  return num;
}

function validateInputs({ qYes, qNo, b, shares, side }) {
  if (b <= 0) {
    throw new Error('b must be greater than 0');
  }
  if (qYes < 0 || qNo < 0) {
    throw new Error('share quantities cannot be negative');
  }
  if (shares !== undefined && shares <= 0) {
    throw new Error('shares must be greater than 0');
  }
  if (side !== undefined && side !== 'YES' && side !== 'NO') {
    throw new Error('side must be YES or NO');
  }
}

function stableExp(x) {
  if (x > 700) {
    return Math.exp(700);
  }
  if (x < -700) {
    return Math.exp(-700);
  }
  return Math.exp(x);
}

function lmsrCost(qYes, qNo, b) {
  qYes = toFiniteNumber(qYes, 'qYes');
  qNo = toFiniteNumber(qNo, 'qNo');
  b = toFiniteNumber(b, 'b');
  validateInputs({ qYes, qNo, b });

  const yesTerm = stableExp(qYes / b);
  const noTerm = stableExp(qNo / b);
  return b * Math.log(yesTerm + noTerm);
}

function boundedProbability(value) {
  if (value <= EPSILON) {
    return EPSILON;
  }
  if (value >= 1 - EPSILON) {
    return 1 - EPSILON;
  }
  return value;
}

function lmsrPriceYes(qYes, qNo, b) {
  qYes = toFiniteNumber(qYes, 'qYes');
  qNo = toFiniteNumber(qNo, 'qNo');
  b = toFiniteNumber(b, 'b');
  validateInputs({ qYes, qNo, b });

  const yesTerm = stableExp(qYes / b);
  const noTerm = stableExp(qNo / b);
  const raw = yesTerm / (yesTerm + noTerm);
  return boundedProbability(raw);
}

function lmsrPriceNo(qYes, qNo, b) {
  return boundedProbability(1 - lmsrPriceYes(qYes, qNo, b));
}

function quoteBinaryTrade({ qYes, qNo, b, side, shares }) {
  qYes = toFiniteNumber(qYes, 'qYes');
  qNo = toFiniteNumber(qNo, 'qNo');
  b = toFiniteNumber(b, 'b');
  shares = toFiniteNumber(shares, 'shares');
  validateInputs({ qYes, qNo, b, shares, side });

  const costBefore = lmsrCost(qYes, qNo, b);
  const qYesAfter = side === 'YES' ? qYes + shares : qYes;
  const qNoAfter = side === 'NO' ? qNo + shares : qNo;
  const costAfter = lmsrCost(qYesAfter, qNoAfter, b);

  const priceYesBefore = lmsrPriceYes(qYes, qNo, b);
  const priceYesAfter = lmsrPriceYes(qYesAfter, qNoAfter, b);

  return {
    side,
    shares,
    cost: costAfter - costBefore,
    qYesBefore: qYes,
    qNoBefore: qNo,
    qYesAfter,
    qNoAfter,
    priceYesBefore,
    priceNoBefore: boundedProbability(1 - priceYesBefore),
    priceYesAfter,
    priceNoAfter: boundedProbability(1 - priceYesAfter),
  };
}

function executeBinaryTrade({ qYes, qNo, b, side, shares }) {
  const quote = quoteBinaryTrade({ qYes, qNo, b, side, shares });
  return {
    ...quote,
    averageExecutionPrice: quote.cost / quote.shares,
  };
}

module.exports = {
  EPSILON,
  lmsrCost,
  lmsrPriceYes,
  lmsrPriceNo,
  quoteBinaryTrade,
  executeBinaryTrade,
};
