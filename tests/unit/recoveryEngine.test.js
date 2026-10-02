const assert = require('node:assert');
const { test, describe } = require('node:test');
const { calculateRecoveryScore } = require('../../backend/src/services/recoveryEngine');

describe('RecoverAI Recovery Engine Unit Tests', () => {
  test('Transient Gateway Timeout yields high recovery probability and auto-retry action', () => {
    const txn = {
      amount: 4999,
      failureCategory: 'TRANSIENT_GATEWAY',
      failureReason: 'Gateway Timeout (504)',
      paymentMethod: 'UPI_INTENT',
      attemptCount: 0,
      createdAt: new Date(),
    };
    const customer = {
      segment: 'MID_MARKET',
      recoveryRate: 88,
      lifetimeValue: 45000,
    };

    const result = calculateRecoveryScore(txn, customer);

    assert.ok(result.recoveryProbability >= 85, `Expected probability >= 85%, got ${result.recoveryProbability}%`);
    assert.strictEqual(result.recommendedAction, 'SMART_AUTO_RETRY');
    assert.strictEqual(result.recommendedChannel, 'WEBHOOK_RETRY');
    assert.ok(result.explanationReasons.length >= 3);
    assert.ok(result.expectedRecovery > 0);
  });

  test('Insufficient funds on UPI selects WhatsApp interactive link', () => {
    const txn = {
      amount: 2850,
      failureCategory: 'INSUFFICIENT_FUNDS',
      failureReason: 'Insufficient account balance in linked bank',
      paymentMethod: 'UPI_INTENT',
      attemptCount: 0,
      createdAt: new Date(),
    };
    const customer = {
      segment: 'SME',
      recoveryRate: 75,
      lifetimeValue: 24000,
    };

    const result = calculateRecoveryScore(txn, customer);

    assert.strictEqual(result.recommendedAction, 'WHATSAPP_PAYMENT_LINK');
    assert.strictEqual(result.recommendedChannel, 'WHATSAPP');
    assert.ok(result.explanationReasons.some(r => r.includes('WhatsApp')));
  });

  test('High fraud risk blocks automated retry and flags manual escalation', () => {
    const txn = {
      amount: 85000,
      failureCategory: 'FRAUD_RESTRICTION',
      failureReason: 'Suspected Fraud Block by Card Issuer',
      paymentMethod: 'CREDIT_CARD',
      attemptCount: 0,
      createdAt: new Date(),
    };
    const customer = {
      segment: 'RETAIL',
      recoveryRate: 50,
      lifetimeValue: 85000,
    };

    const result = calculateRecoveryScore(txn, customer);

    assert.ok(result.recoveryProbability < 40, `Expected low probability for fraud, got ${result.recoveryProbability}%`);
    assert.strictEqual(result.recommendedAction, 'MANUAL_CALL_ESCALATION');
    assert.strictEqual(result.recommendedChannel, 'AGENT_OUTREACH');
  });

  test('Multiple failed attempts degrade recovery probability and switch strategy', () => {
    const customer = { segment: 'SME', recoveryRate: 70, lifetimeValue: 15000 };
    const freshTxn = {
      amount: 1499,
      failureCategory: 'BANK_DECLINE',
      paymentMethod: 'CREDIT_CARD',
      attemptCount: 0,
      createdAt: new Date(),
    };
    const degradedTxn = {
      amount: 1499,
      failureCategory: 'BANK_DECLINE',
      paymentMethod: 'CREDIT_CARD',
      attemptCount: 3,
      createdAt: new Date(Date.now() - 72 * 3600 * 1000),
    };

    const freshScore = calculateRecoveryScore(freshTxn, customer);
    const degradedScore = calculateRecoveryScore(degradedTxn, customer);

    assert.ok(freshScore.recoveryProbability > degradedScore.recoveryProbability);
    assert.strictEqual(degradedScore.recommendedAction, 'MANUAL_CALL_ESCALATION');
  });
});
