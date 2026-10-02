const prisma = require('../config/db');
const { calculateRecoveryScore } = require('./recoveryEngine');
const { recordAuditLog } = require('./auditService');
const { createNotification } = require('./notificationService');

/**
 * Executes a simulated recovery attempt on a failed transaction.
 * Factors in deterministic probability + realistic gateway response.
 */
async function executeRecoveryAttempt({
  transactionId,
  channel,
  actionType,
  campaignId = null,
  user = { id: null, name: 'RecoverAI Engine', role: 'SYSTEM' },
  forceSuccess = null,
}) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      customer: true,
      recommendation: true,
    },
  });

  if (!transaction) {
    throw new Error('Transaction not found');
  }

  if (transaction.status === 'RECOVERED') {
    throw new Error('Transaction is already recovered');
  }

  // Calculate or retrieve recommendation
  let recommendation = transaction.recommendation;
  if (!recommendation) {
    const score = calculateRecoveryScore(transaction, transaction.customer);
    recommendation = await prisma.recoveryRecommendation.create({
      data: {
        transactionId: transaction.id,
        recoveryProbability: score.recoveryProbability,
        priorityScore: score.priorityScore,
        priorityNumeric: score.priorityNumeric,
        expectedRecovery: score.expectedRecovery,
        recommendedAction: score.recommendedAction,
        recommendedChannel: score.recommendedChannel,
        optimalRetryWindow: score.optimalRetryWindow,
        explanationReasons: JSON.stringify(score.explanationReasons),
        confidenceScore: score.confidenceScore,
        isExecuted: true,
      },
    });
  }

  const selectedChannel = channel || recommendation.recommendedChannel || 'WHATSAPP';
  const selectedAction = actionType || recommendation.recommendedAction || 'SMART_AUTO_RETRY';

  // Determine outcome based on deterministic probability
  // If forceSuccess is specified (for demo/testing), use that, otherwise deterministic roll
  const probability = recommendation.recoveryProbability;
  // Deterministic seed simulation based on txn ID and attempt count
  const pseudoRandom = ((transaction.amount * 17 + (transaction.attemptCount + 1) * 31) % 100);
  const isSuccessful = forceSuccess !== null ? Boolean(forceSuccess) : (pseudoRandom <= probability);

  const responseTimeSecs = Math.floor(Math.random() * 8) + 2; // 2-10 seconds turnaround
  const newAttemptCount = transaction.attemptCount + 1;

  let attemptStatus = isSuccessful ? 'COMPLETED_PAYMENT' : 'FAILED';
  let failureDetails = null;

  if (!isSuccessful) {
    if (newAttemptCount >= transaction.maxAllowedAttempts) {
      failureDetails = `Max attempts (${transaction.maxAllowedAttempts}) exceeded. Final recovery attempt declined by bank/customer.`;
    } else {
      failureDetails = `Channel delivery confirmed (${selectedChannel}), but payment authorization was not completed.`;
    }
  }

  // Create Recovery Attempt record
  const attempt = await prisma.recoveryAttempt.create({
    data: {
      transactionId: transaction.id,
      campaignId,
      channel: selectedChannel,
      actionType: selectedAction,
      status: attemptStatus,
      responseTimeSecs,
      failureDetails,
      executedBy: user.name || 'RecoverAI Engine',
      metadata: JSON.stringify({
        channel: selectedChannel,
        action: selectedAction,
        probability,
        gatewayRef: `gw_ret_${Math.random().toString(36).substring(2, 9)}`,
      }),
    },
  });

  // Update transaction state
  let newStatus = transaction.status;
  let recoveredAt = transaction.recoveredAt;

  if (isSuccessful) {
    newStatus = 'RECOVERED';
    recoveredAt = new Date();

    // Update customer stats
    const updatedSuccessCount = transaction.customer.successfulTransactions + 1;
    const updatedTotal = transaction.customer.totalTransactions;
    const newRecRate = Math.round((updatedSuccessCount / Math.max(1, updatedTotal)) * 100);
    const newLTV = transaction.customer.lifetimeValue + transaction.amount;

    await prisma.customer.update({
      where: { id: transaction.customer.id },
      data: {
        successfulTransactions: updatedSuccessCount,
        failedTransactions: Math.max(0, transaction.customer.failedTransactions - 1),
        recoveryRate: newRecRate,
        lifetimeValue: newLTV,
      },
    });

    // Send Notification
    await createNotification({
      organizationId: transaction.organizationId,
      userId: user.id,
      title: 'Payment Successfully Recovered',
      message: `Recovered ₹${transaction.amount.toLocaleString('en-IN')} from ${transaction.customer.name} via ${selectedChannel}.`,
      type: 'RECOVERY_SUCCESS',
      link: `/transactions/${transaction.id}`,
      metadata: { transactionId: transaction.id, amount: transaction.amount, channel: selectedChannel },
    });

  } else {
    newStatus = (newAttemptCount >= transaction.maxAllowedAttempts) ? 'ABANDONED' : 'IN_RECOVERY';

    await createNotification({
      organizationId: transaction.organizationId,
      userId: user.id,
      title: 'Recovery Attempt Unsuccessful',
      message: `Attempt #${newAttemptCount} via ${selectedChannel} for ₹${transaction.amount.toLocaleString('en-IN')} failed.`,
      type: 'RECOVERY_FAILED',
      link: `/transactions/${transaction.id}`,
      metadata: { transactionId: transaction.id, attemptCount: newAttemptCount },
    });
  }

  const updatedTxn = await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      status: newStatus,
      attemptCount: newAttemptCount,
      lastAttemptAt: new Date(),
      recoveredAt,
    },
    include: {
      customer: true,
      recommendation: true,
      recoveryAttempts: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  // Mark recommendation as executed
  if (transaction.recommendation) {
    await prisma.recoveryRecommendation.update({
      where: { id: transaction.recommendation.id },
      data: { isExecuted: true },
    });
  }

  // Record Audit Log
  await recordAuditLog({
    organizationId: transaction.organizationId,
    userId: user.id,
    userName: user.name || 'RecoverAI Engine',
    userRole: user.role || 'SYSTEM',
    action: isSuccessful ? 'EXECUTE_RECOVERY_SUCCESS' : 'EXECUTE_RECOVERY_FAILURE',
    entityType: 'TRANSACTION',
    entityId: transaction.id,
    details: {
      amount: transaction.amount,
      customerName: transaction.customer.name,
      channel: selectedChannel,
      action: selectedAction,
      isSuccessful,
      newStatus,
      attemptId: attempt.id,
    },
  });

  return {
    success: isSuccessful,
    transaction: updatedTxn,
    attempt,
  };
}

module.exports = {
  executeRecoveryAttempt,
};
