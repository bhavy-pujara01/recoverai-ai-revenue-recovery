const prisma = require('../config/db');

async function getAnalyticsOverview(req, res, next) {
  try {
    const orgId = req.user.organizationId;
    const { timeRange = '30d' } = req.query;

    // Time filter
    let days = 30;
    if (timeRange === '7d') days = 7;
    if (timeRange === '90d') days = 90;
    if (timeRange === 'all') days = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const transactions = await prisma.transaction.findMany({
      where: {
        organizationId: orgId,
        createdAt: { gte: startDate },
      },
      include: {
        customer: true,
        recommendation: true,
        recoveryAttempts: true,
      },
    });

    const totalTxnCount = transactions.length;
    let totalFailedAmount = 0;
    let totalRecoveredAmount = 0;
    let recoverablePipelineAmount = 0;
    let recoveredTxnCount = 0;
    let failedTxnCount = 0;
    let inRecoveryTxnCount = 0;
    let abandonedTxnCount = 0;

    let totalRecoveryDurationSecs = 0;
    let recoveryDurationSamples = 0;

    transactions.forEach(t => {
      totalFailedAmount += t.amount;
      if (t.status === 'RECOVERED') {
        recoveredTxnCount += 1;
        totalRecoveredAmount += t.amount;
        if (t.recoveredAt && t.createdAt) {
          const duration = (new Date(t.recoveredAt).getTime() - new Date(t.createdAt).getTime()) / 1000;
          if (duration > 0) {
            totalRecoveryDurationSecs += duration;
            recoveryDurationSamples += 1;
          }
        }
      } else if (t.status === 'IN_RECOVERY') {
        inRecoveryTxnCount += 1;
        if (t.recommendation) {
          recoverablePipelineAmount += t.recommendation.expectedRecovery;
        }
      } else if (t.status === 'ABANDONED') {
        abandonedTxnCount += 1;
      } else {
        failedTxnCount += 1;
        if (t.recommendation) {
          recoverablePipelineAmount += t.recommendation.expectedRecovery;
        }
      }
    });

    const recoveryRate = totalTxnCount > 0 ? Math.round((recoveredTxnCount / totalTxnCount) * 1000) / 10 : 0;
    const avgRecoveryMinutes = recoveryDurationSamples > 0 ? Math.round((totalRecoveryDurationSecs / recoveryDurationSamples) / 60) : 42;

    // 1. Failure Categories Breakdown
    const failureMap = {};
    transactions.forEach(t => {
      const cat = t.failureCategory || 'OTHER';
      if (!failureMap[cat]) {
        failureMap[cat] = { category: cat, count: 0, totalAmount: 0, recoveredCount: 0, recoveredAmount: 0 };
      }
      failureMap[cat].count += 1;
      failureMap[cat].totalAmount += t.amount;
      if (t.status === 'RECOVERED') {
        failureMap[cat].recoveredCount += 1;
        failureMap[cat].recoveredAmount += t.amount;
      }
    });

    const failureBreakdown = Object.values(failureMap).map(f => ({
      ...f,
      recoveryRate: f.count > 0 ? Math.round((f.recoveredCount / f.count) * 100) : 0,
    }));

    // 2. Channel Performance
    const attempts = await prisma.recoveryAttempt.findMany({
      where: {
        transaction: { organizationId: orgId },
        createdAt: { gte: startDate },
      },
      include: { transaction: true },
    });

    const channelMap = {};
    attempts.forEach(a => {
      const ch = a.channel || 'OTHER';
      if (!channelMap[ch]) {
        channelMap[ch] = { channel: ch, totalAttempts: 0, successfulAttempts: 0, recoveredAmount: 0 };
      }
      channelMap[ch].totalAttempts += 1;
      if (a.status === 'COMPLETED_PAYMENT') {
        channelMap[ch].successfulAttempts += 1;
        channelMap[ch].recoveredAmount += a.transaction ? a.transaction.amount : 0;
      }
    });

    const channelPerformance = Object.values(channelMap).map(c => ({
      ...c,
      conversionRate: c.totalAttempts > 0 ? Math.round((c.successfulAttempts / c.totalAttempts) * 100) : 0,
    }));

    // 3. Payment Method Distribution
    const methodMap = {};
    transactions.forEach(t => {
      const pm = t.paymentMethod || 'OTHER';
      if (!methodMap[pm]) {
        methodMap[pm] = { method: pm, totalCount: 0, recoveredCount: 0, totalVolume: 0, recoveredVolume: 0 };
      }
      methodMap[pm].totalCount += 1;
      methodMap[pm].totalVolume += t.amount;
      if (t.status === 'RECOVERED') {
        methodMap[pm].recoveredCount += 1;
        methodMap[pm].recoveredVolume += t.amount;
      }
    });

    const paymentMethodBreakdown = Object.values(methodMap).map(m => ({
      ...m,
      recoveryRate: m.totalCount > 0 ? Math.round((m.recoveredCount / m.totalCount) * 100) : 0,
    }));

    // 4. Trend Data (Group by Day / Date)
    const trendMap = {};
    transactions.forEach(t => {
      const dateKey = new Date(t.createdAt).toISOString().split('T')[0];
      if (!trendMap[dateKey]) {
        trendMap[dateKey] = { date: dateKey, failed: 0, recovered: 0, failedAmount: 0, recoveredAmount: 0 };
      }
      trendMap[dateKey].failed += 1;
      trendMap[dateKey].failedAmount += t.amount;
      if (t.status === 'RECOVERED') {
        trendMap[dateKey].recovered += 1;
        trendMap[dateKey].recoveredAmount += t.amount;
      }
    });

    const trendData = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

    // 5. Segment Performance
    const segmentMap = {};
    transactions.forEach(t => {
      const seg = t.customer ? t.customer.segment : 'SME';
      if (!segmentMap[seg]) {
        segmentMap[seg] = { segment: seg, totalTxns: 0, recoveredTxns: 0, volume: 0, recoveredVolume: 0 };
      }
      segmentMap[seg].totalTxns += 1;
      segmentMap[seg].volume += t.amount;
      if (t.status === 'RECOVERED') {
        segmentMap[seg].recoveredTxns += 1;
        segmentMap[seg].recoveredVolume += t.amount;
      }
    });

    const segmentPerformance = Object.values(segmentMap).map(s => ({
      ...s,
      recoveryRate: s.totalTxns > 0 ? Math.round((s.recoveredTxns / s.totalTxns) * 100) : 0,
    }));

    res.json({
      success: true,
      data: {
        kpi: {
          totalGrossFailedVolume: totalFailedAmount,
          totalRecoveredVolume: totalRecoveredAmount,
          recoverablePipelineVolume: recoverablePipelineAmount,
          recoveryRate,
          avgRecoveryMinutes,
          totalTxnCount,
          recoveredTxnCount,
          failedTxnCount,
          inRecoveryTxnCount,
          abandonedTxnCount,
        },
        trendData,
        failureBreakdown,
        channelPerformance,
        paymentMethodBreakdown,
        segmentPerformance,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAnalyticsOverview,
};
