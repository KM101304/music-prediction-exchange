const test = require('node:test');
const assert = require('node:assert/strict');
const { lmsrCost, lmsrPriceYes, lmsrPriceNo, lmsrTradeCost } = require('../src/lib/lmsr');

test('LMSR prices sum to 1', () => {
  const pYes = lmsrPriceYes(12, 7, 100);
  const pNo = lmsrPriceNo(12, 7, 100);
  assert.ok(Math.abs(pYes + pNo - 1) < 1e-12);
});

test('LMSR trade cost is positive and updates YES shares', () => {
  const trade = lmsrTradeCost({ qYes: 0, qNo: 0, b: 100, side: 'YES', shares: 50 });
  assert.ok(trade.cost > 0);
  assert.equal(trade.qYesAfter, 50);
  assert.equal(trade.qNoAfter, 0);
  assert.ok(trade.priceYesAfter > trade.priceYesBefore);
});

test('LMSR trade cost equals cost function delta', () => {
  const qYes = 42;
  const qNo = 17;
  const b = 80;
  const shares = 11;
  const trade = lmsrTradeCost({ qYes, qNo, b, side: 'NO', shares });
  const delta = lmsrCost(qYes, qNo + shares, b) - lmsrCost(qYes, qNo, b);
  assert.ok(Math.abs(trade.cost - delta) < 1e-12);
});

test('invalid LMSR input throws', () => {
  assert.throws(() => lmsrTradeCost({ qYes: 0, qNo: 0, b: 0, side: 'YES', shares: 1 }));
  assert.throws(() => lmsrTradeCost({ qYes: 0, qNo: 0, b: 10, side: 'YES', shares: 0 }));
});
