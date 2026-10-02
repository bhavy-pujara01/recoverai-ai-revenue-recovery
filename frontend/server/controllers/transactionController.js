const prisma = require('../config/db');
const { calculateRecoveryScore } = require('../services/recoveryEngine');
const { executeRecoveryAttempt } = require('../services/simulationService');
const { recordAuditLog } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');

async function listTransactions(req, res, next) {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      status,
      failureCategory,
      paymentMethod,
      priority,
      minAmount,
      maxAmount,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const take = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * take;

    const where = {
      organizationId: req.user.organizationId,
    };

    if (search) {
      where.OR = [
        { externalTxnId: { contains: search } },
        { orderId: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { email: { contains: search } } },
        { customer: { phone: { contains: search } } },
      ];
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (failureCategory && failureCategory !== 'ALL') {
      where.failureCategory = failureCategory;
    }

    if (paymentMethod && paymentMethod !== 'ALL') {
      where.paymentMethod = paymentMethod;
    }

    if (priority && priority !== 'ALL') {
      where.recommendation = {
        priorityScore: priority,
      };
    }

    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount.gte = parseFloat(minAmount);
      if (maxAmount) where.amount.lte = parseFloat(maxAmount);
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    // Determine orderBy
    let orderBy = {};
    if (sortBy === 'priority') {
      orderBy = {
        recommendation: {
          priorityNumeric: sortOrder === 'asc' ? 'asc' : 'desc',
        },
      };
    } else if (sortBy === 'probability') {
      orderBy = {
        recommendation: {
          recoveryProbability: sortOrder === 'asc' ? 'asc' : 'desc',
        },
      };
    } else {
      orderBy = { [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc' };
    }

    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          customer: true,
          recommendation: true,
          recoveryAttempts: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      }),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getTransactionById(req, res, next) {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId,
      },
      include: {
        customer: {
          include: {
            transactions: {
              where: { id: { not: id } },
              take: 5,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        recommendation: true,
        recoveryAttempts: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    // Parse JSON fields safely
    let explanationReasons = [];
    if (transaction.recommendation && transaction.recommendation.explanationReasons) {
      try {
        explanationReasons = JSON.parse(transaction.recommendation.explanationReasons);
      } catch (e) {
        explanationReasons = [transaction.recommendation.explanationReasons];
      }
    }

    // Fetch related audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        entityId: id,
        organizationId: req.user.organizationId,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    res.json({
      success: true,
      data: {
        ...transaction,
        recommendation: transaction.recommendation ? {
          ...transaction.recommendation,
          explanationReasons,
        } : null,
        auditLogs,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function generateRecommendation(req, res, next) {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId,
      },
      include: { customer: true, recommendation: true },
    });

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    const score = calculateRecoveryScore(transaction, transaction.customer);

    const recommendation = await prisma.recoveryRecommendation.upsert({
      where: { transactionId: transaction.id },
      update: {
        recoveryProbability: score.recoveryProbability,
        priorityScore: score.priorityScore,
        priorityNumeric: score.priorityNumeric,
        expectedRecovery: score.expectedRecovery,
        recommendedAction: score.recommendedAction,
        recommendedChannel: score.recommendedChannel,
        optimalRetryWindow: score.optimalRetryWindow,
        explanationReasons: JSON.stringify(score.explanationReasons),
        confidenceScore: score.confidenceScore,
      },
      create: {
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
      },
    });

    await recordAuditLog({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'GENERATE_RECOMMENDATION',
      entityType: 'TRANSACTION',
      entityId: transaction.id,
      details: {
        probability: score.recoveryProbability,
        priority: score.priorityScore,
        recommendedAction: score.recommendedAction,
      },
    });

    res.json({
      success: true,
      data: {
        ...recommendation,
        explanationReasons: score.explanationReasons,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function executeRecovery(req, res, next) {
  try {
    const { id } = req.params;
    const { channel, actionType, forceSuccess } = req.body;

    const result = await executeRecoveryAttempt({
      transactionId: id,
      channel,
      actionType,
      user: {
        id: req.user.id,
        name: req.user.name,
        role: req.user.role,
      },
      forceSuccess: forceSuccess !== undefined ? Boolean(forceSuccess) : null,
    });

    res.json({
      success: true,
      message: result.success ? 'Payment recovery successful!' : 'Recovery attempt processed but not completed.',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

async function batchExecuteRecovery(req, res, next) {
  try {
    const { transactionIds, channel, actionType } = req.body;

    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Array of transactionIds is required' });
    }

    const results = [];
    let recoveredCount = 0;
    let recoveredAmount = 0;

    for (const txnId of transactionIds) {
      try {
        const result = await executeRecoveryAttempt({
          transactionId: txnId,
          channel,
          actionType,
          user: {
            id: req.user.id,
            name: req.user.name,
            role: req.user.role,
          },
        });
        results.push(result);
        if (result.success) {
          recoveredCount += 1;
          recoveredAmount += result.transaction.amount;
        }
      } catch (err) {
        console.error(`Batch recovery error for txn ${txnId}:`, err.message);
      }
    }

    await recordAuditLog({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'BATCH_EXECUTE_RECOVERY',
      entityType: 'TRANSACTION',
      details: {
        totalSelected: transactionIds.length,
        processed: results.length,
        recoveredCount,
        recoveredAmount,
      },
    });

    res.json({
      success: true,
      message: `Batch recovery complete: ${recoveredCount} of ${results.length} payments recovered (₹${recoveredAmount.toLocaleString('en-IN')}).`,
      summary: {
        total: results.length,
        recoveredCount,
        recoveredAmount,
      },
      results,
    });
  } catch (error) {
    next(error);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!['FAILED', 'IN_RECOVERY', 'RECOVERED', 'ABANDONED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status value' });
    }

    const transaction = await prisma.transaction.findFirst({
      where: { id, organizationId: req.user.organizationId },
      include: { customer: true },
    });

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    const previousStatus = transaction.status;
    let recoveredAt = transaction.recoveredAt;

    if (status === 'RECOVERED' && previousStatus !== 'RECOVERED') {
      recoveredAt = new Date();
      // Update customer stats
      await prisma.customer.update({
        where: { id: transaction.customer.id },
        data: {
          successfulTransactions: { increment: 1 },
          failedTransactions: { decrement: 1 },
          lifetimeValue: { increment: transaction.amount },
        },
      });
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        status,
        recoveredAt,
      },
      include: { customer: true, recommendation: true },
    });

    await recordAuditLog({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'UPDATE_TRANSACTION_STATUS',
      entityType: 'TRANSACTION',
      entityId: id,
      details: {
        previousStatus,
        newStatus: status,
        note: note || 'Manual status change by user',
      },
    });

    res.json({
      success: true,
      data: updated,
      message: `Transaction status updated to ${status}`,
    });
  } catch (error) {
    next(error);
  }
}

async function createSimulatedTransaction(req, res, next) {
  try {
    const {
      customerId,
      amount,
      failureCategory = 'TRANSIENT_GATEWAY',
      failureReason = 'Gateway Timeout (504)',
      paymentMethod = 'UPI_INTENT',
      cardIssuer = 'HDFC Bank',
      upiApp = 'Google Pay',
    } = req.body;

    let targetCustomer;
    if (customerId) {
      targetCustomer = await prisma.customer.findUnique({ where: { id: customerId } });
    } else {
      // Pick first customer or create one
      targetCustomer = await prisma.customer.findFirst({
        where: { organizationId: req.user.organizationId },
      });
    }

    if (!targetCustomer) {
      return res.status(400).json({ success: false, error: 'No customer found to attach transaction to' });
    }

    const txnAmount = parseFloat(amount) || (Math.floor(Math.random() * 8000) + 1200);
    const externalTxnId = `txn_in_${Math.random().toString(36).substring(2, 9)}`;
    const orderId = `ord_live_${Math.random().toString(36).substring(2, 8)}`;

    const transaction = await prisma.transaction.create({
      data: {
        organizationId: req.user.organizationId,
        customerId: targetCustomer.id,
        externalTxnId,
        orderId,
        amount: txnAmount,
        currency: 'INR',
        status: 'FAILED',
        failureCategory,
        rawFailureCode: 'ERR_' + failureCategory,
        failureReason,
        paymentMethod,
        cardIssuer,
        upiApp,
      },
      include: { customer: true },
    });

    // Automatically calculate initial recovery recommendation
    const score = calculateRecoveryScore(transaction, targetCustomer);
    const recommendation = await prisma.recoveryRecommendation.create({
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
      },
    });

    // Update customer failed count
    await prisma.customer.update({
      where: { id: targetCustomer.id },
      data: {
        totalTransactions: { increment: 1 },
        failedTransactions: { increment: 1 },
      },
    });

    // Notify user
    await createNotification({
      organizationId: req.user.organizationId,
      title: 'New Failed Payment Captured',
      message: `Captured failed payment ₹${txnAmount.toLocaleString('en-IN')} for ${targetCustomer.name} (${failureReason}).`,
      type: 'CRITICAL_TXN',
      link: `/transactions/${transaction.id}`,
    });

    await recordAuditLog({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'INJECT_SIMULATED_TRANSACTION',
      entityType: 'TRANSACTION',
      entityId: transaction.id,
      details: { amount: txnAmount, customerName: targetCustomer.name, failureReason },
    });

    res.status(201).json({
      success: true,
      data: {
        ...transaction,
        recommendation: {
          ...recommendation,
          explanationReasons: score.explanationReasons,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listTransactions,
  getTransactionById,
  generateRecommendation,
  executeRecovery,
  batchExecuteRecovery,
  updateStatus,
  createSimulatedTransaction,
};
