const test = require('node:test');
const assert = require('node:assert/strict');
const {
  EPSILON,
  lmsrCost,
  lmsrPriceYes,
  lmsrPriceNo,
  quoteBinaryTrade,
  executeBinaryTrade,
} = require('../src/lib/lmsr');

test('prices sum to approximately 1', () => {
  const pYes = lmsrPriceYes(12, 7, 100);
  const pNo = lmsrPriceNo(12, 7, 100);
  assert.ok(Math.abs(pYes + pNo - 1) < 1e-9);
});

test('quoteBinaryTrade returns deterministic cost delta', () => {
  const qYes = 42;
  const qNo = 17;
  const b = 80;
  const shares = 11;

  const quote = quoteBinaryTrade({ qYes, qNo, b, side: 'NO', shares });
  const expected = lmsrCost(qYes, qNo + shares, b) - lmsrCost(qYes, qNo, b);
  assert.ok(Math.abs(quote.cost - expected) < 1e-12);
});

test('executeBinaryTrade increases YES probability for YES buy', () => {
  const execution = executeBinaryTrade({ qYes: 10, qNo: 10, b: 100, side: 'YES', shares: 50 });
  assert.ok(execution.priceYesAfter > execution.priceYesBefore);
  assert.ok(execution.averageExecutionPrice > 0);
});

test('probabilities stay bounded away from 0 and 1', () => {
  const almostOne = lmsrPriceYes(1_000_000, 0, 10);
  const almostZero = lmsrPriceYes(0, 1_000_000, 10);
  assert.ok(almostOne < 1);
  assert.ok(almostZero > 0);
  assert.ok(almostOne <= 1 - EPSILON);
  assert.ok(almostZero >= EPSILON);
});

test('invalid inputs throw', () => {
  assert.throws(() => quoteBinaryTrade({ qYes: 0, qNo: 0, b: 0, side: 'YES', shares: 10 }));
  assert.throws(() => executeBinaryTrade({ qYes: -1, qNo: 0, b: 100, side: 'YES', shares: 1 }));
  assert.throws(() => quoteBinaryTrade({ qYes: 0, qNo: 0, b: 100, side: 'MAYBE', shares: 10 }));
});
