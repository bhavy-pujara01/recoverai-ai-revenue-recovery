const assert = require('node:assert');
const { test, describe } = require('node:test');

const BASE_URL = 'http://localhost:5000/api';

describe('RecoverAI Backend Integration API Tests', () => {
  let authToken = '';
  let sampleTxnId = '';
  let sampleCampaignId = '';

  test('Health check returns status healthy', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.status, 'healthy');
  });

  test('Admin demo login succeeds and returns JWT token', async () => {
    const res = await fetch(`${BASE_URL}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'ADMIN' }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.token);
    assert.strictEqual(data.user.role, 'ADMIN');
    authToken = data.token;
  });

  test('Authenticated user can fetch transaction list', async () => {
    const res = await fetch(`${BASE_URL}/transactions?limit=5`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.data));
    assert.ok(data.data.length > 0);
    sampleTxnId = data.data[0].id;
  });

  test('Authenticated user can fetch transaction detail and explainability', async () => {
    assert.ok(sampleTxnId, 'Sample txn ID must exist');
    const res = await fetch(`${BASE_URL}/transactions/${sampleTxnId}`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.id, sampleTxnId);
    assert.ok(data.data.customer);
    if (data.data.recommendation) {
      assert.ok(Array.isArray(data.data.recommendation.explanationReasons));
    }
  });

  test('Generate recommendation API produces deterministic output', async () => {
    const res = await fetch(`${BASE_URL}/transactions/${sampleTxnId}/recommendation`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.data.recoveryProbability > 0);
  });

  test('Fetch Analytics Overview KPI and distributions', async () => {
    const res = await fetch(`${BASE_URL}/analytics/overview?timeRange=30d`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(data.data.kpi);
    assert.ok(data.data.kpi.totalGrossFailedVolume >= 0);
    assert.ok(Array.isArray(data.data.failureBreakdown));
  });

  test('Fetch Customer Directory', async () => {
    const res = await fetch(`${BASE_URL}/customers?limit=10`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.data));
  });

  test('Fetch Campaign List & Details', async () => {
    const res = await fetch(`${BASE_URL}/campaigns`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.ok(Array.isArray(data.data));
    if (data.data.length > 0) {
      sampleCampaignId = data.data[0].id;
    }
  });

  test('Inject Simulated Failed Payment and verify end-to-end', async () => {
    const res = await fetch(`${BASE_URL}/transactions/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        amount: 7999,
        failureCategory: 'TRANSIENT_GATEWAY',
        failureReason: 'Gateway 504 Timeout',
        paymentMethod: 'UPI_INTENT',
      }),
    });
    const data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.data.amount, 7999);
    assert.ok(data.data.recommendation);
  });
});
