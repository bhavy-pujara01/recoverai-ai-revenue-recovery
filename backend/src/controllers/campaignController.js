const prisma = require('../config/db');
const { executeRecoveryAttempt } = require('../services/simulationService');
const { recordAuditLog } = require('../services/auditService');
const { createNotification } = require('../services/notificationService');

async function listCampaigns(req, res, next) {
  try {
    const { status, search } = req.query;

    const where = {
      organizationId: req.user.organizationId,
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const campaigns = await prisma.recoveryCampaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { attempts: true },
        },
      },
    });

    const formatted = campaigns.map(c => {
      let channels = [];
      let workflow = [];
      try {
        channels = JSON.parse(c.channels);
      } catch (e) {
        channels = [];
      }
      try {
        workflow = JSON.parse(c.actionWorkflow);
      } catch (e) {
        workflow = [];
      }
      return {
        ...c,
        channels,
        actionWorkflow: workflow,
      };
    });

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    next(error);
  }
}

async function getCampaignById(req, res, next) {
  try {
    const { id } = req.params;

    const campaign = await prisma.recoveryCampaign.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId,
      },
      include: {
        attempts: {
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: {
            transaction: {
              include: { customer: true },
            },
          },
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    let channels = [];
    let workflow = [];
    try {
      channels = JSON.parse(campaign.channels);
    } catch (e) {
      channels = [];
    }
    try {
      workflow = JSON.parse(campaign.actionWorkflow);
    } catch (e) {
      workflow = [];
    }

    res.json({
      success: true,
      data: {
        ...campaign,
        channels,
        actionWorkflow: workflow,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function createCampaign(req, res, next) {
  try {
    const {
      name,
      description,
      targetSegment = 'ALL',
      minAmount = 0,
      maxAmount = 1000000,
      channels = ['WHATSAPP', 'SMS'],
      actionWorkflow = [],
    } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Campaign name is required' });
    }

    // Estimate audience count
    const customerWhere = {
      organizationId: req.user.organizationId,
    };
    if (targetSegment !== 'ALL') {
      customerWhere.segment = targetSegment;
    }

    const eligibleTxns = await prisma.transaction.count({
      where: {
        organizationId: req.user.organizationId,
        status: { in: ['FAILED', 'IN_RECOVERY'] },
        amount: {
          gte: parseFloat(minAmount) || 0,
          lte: parseFloat(maxAmount) || 1000000,
        },
        customer: customerWhere,
      },
    });

    const campaign = await prisma.recoveryCampaign.create({
      data: {
        organizationId: req.user.organizationId,
        name,
        description: description || `Automated recovery sequence for ${targetSegment} segment failed payments`,
        status: 'DRAFT',
        targetSegment,
        minAmount: parseFloat(minAmount) || 0,
        maxAmount: parseFloat(maxAmount) || 1000000,
        channels: JSON.stringify(channels),
        actionWorkflow: JSON.stringify(actionWorkflow),
        totalAudience: eligibleTxns,
        createdBy: req.user.name,
      },
    });

    await recordAuditLog({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'CREATE_CAMPAIGN',
      entityType: 'CAMPAIGN',
      entityId: campaign.id,
      details: { name: campaign.name, targetSegment, estimatedAudience: eligibleTxns },
    });

    res.status(201).json({
      success: true,
      data: {
        ...campaign,
        channels,
        actionWorkflow,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function launchCampaign(req, res, next) {
  try {
    const { id } = req.params;

    const campaign = await prisma.recoveryCampaign.findFirst({
      where: { id, organizationId: req.user.organizationId },
    });

    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    // Parse channels
    let channels = ['WHATSAPP'];
    try {
      channels = JSON.parse(campaign.channels);
    } catch (e) {
      channels = ['WHATSAPP'];
    }

    // Find eligible failed transactions
    const customerWhere = {};
    if (campaign.targetSegment !== 'ALL') {
      customerWhere.segment = campaign.targetSegment;
    }

    const targetTransactions = await prisma.transaction.findMany({
      where: {
        organizationId: req.user.organizationId,
        status: { in: ['FAILED', 'IN_RECOVERY'] },
        amount: {
          gte: campaign.minAmount,
          lte: campaign.maxAmount,
        },
        customer: customerWhere,
      },
      include: { customer: true, recommendation: true },
      take: 20, // process in realistic batches
    });

    // Update campaign to RUNNING
    await prisma.recoveryCampaign.update({
      where: { id },
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
        totalAudience: targetTransactions.length,
      },
    });

    let recoveredCount = 0;
    let recoveredAmount = 0;
    let processedCount = 0;

    for (const txn of targetTransactions) {
      const channel = channels[processedCount % channels.length] || 'WHATSAPP';
      try {
        const result = await executeRecoveryAttempt({
          transactionId: txn.id,
          channel,
          actionType: 'SMART_LINK',
          campaignId: campaign.id,
          user: {
            id: req.user.id,
            name: `${req.user.name} (Campaign: ${campaign.name})`,
            role: req.user.role,
          },
        });

        processedCount += 1;
        if (result.success) {
          recoveredCount += 1;
          recoveredAmount += txn.amount;
        }
      } catch (err) {
        console.error('Error processing campaign txn:', err.message);
      }
    }

    const successRate = processedCount > 0 ? Math.round((recoveredCount / processedCount) * 100) : 0;

    const updatedCampaign = await prisma.recoveryCampaign.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        processedCount,
        recoveredCount,
        recoveredAmount,
        successRate,
      },
    });

    // Send Notification
    await createNotification({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      title: `Campaign '${campaign.name}' Completed`,
      message: `Processed ${processedCount} payments. Recovered ₹${recoveredAmount.toLocaleString('en-IN')} (${successRate}% success rate).`,
      type: 'CAMPAIGN_COMPLETED',
      link: `/campaigns/${campaign.id}`,
      metadata: { campaignId: campaign.id, recoveredAmount, successRate },
    });

    await recordAuditLog({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'LAUNCH_CAMPAIGN_COMPLETE',
      entityType: 'CAMPAIGN',
      entityId: campaign.id,
      details: {
        campaignName: campaign.name,
        processedCount,
        recoveredCount,
        recoveredAmount,
        successRate,
      },
    });

    res.json({
      success: true,
      message: `Campaign execution finished. Recovered ₹${recoveredAmount.toLocaleString('en-IN')} from ${recoveredCount} payments.`,
      data: {
        ...updatedCampaign,
        channels,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function updateCampaignStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'PAUSED'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid campaign status' });
    }

    const campaign = await prisma.recoveryCampaign.update({
      where: { id },
      data: { status },
    });

    await recordAuditLog({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'UPDATE_CAMPAIGN_STATUS',
      entityType: 'CAMPAIGN',
      entityId: id,
      details: { newStatus: status },
    });

    res.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listCampaigns,
  getCampaignById,
  createCampaign,
  launchCampaign,
  updateCampaignStatus,
};
