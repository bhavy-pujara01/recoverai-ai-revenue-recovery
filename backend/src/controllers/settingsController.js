const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { recordAuditLog } = require('../services/auditService');

async function getSettings(req, res, next) {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.user.organizationId },
      include: {
        settings: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!org) {
      return res.status(404).json({ success: false, error: 'Organization not found' });
    }

    let enabledChannels = ['WHATSAPP', 'SMS', 'EMAIL', 'WEBHOOK_RETRY'];
    if (org.settings && org.settings.enabledChannels) {
      try {
        enabledChannels = JSON.parse(org.settings.enabledChannels);
      } catch (e) {
        enabledChannels = ['WHATSAPP', 'SMS', 'EMAIL', 'WEBHOOK_RETRY'];
      }
    }

    res.json({
      success: true,
      data: {
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
          industry: org.industry,
          currency: org.currency,
          timezone: org.timezone,
          autoRecoveryEnabled: org.autoRecoveryEnabled,
        },
        settings: org.settings ? {
          ...org.settings,
          enabledChannels,
        } : null,
        users: org.users,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function updateSettings(req, res, next) {
  try {
    const {
      organizationName,
      industry,
      autoRecoveryEnabled,
      retryWindowMinutes,
      autoExecuteRecovery,
      minConfidenceThreshold,
      enabledChannels,
      slackWebhookUrl,
      supportEmail,
      webhookUrl,
    } = req.body;

    const orgId = req.user.organizationId;

    // Update Organization fields
    if (organizationName || industry || autoRecoveryEnabled !== undefined) {
      await prisma.organization.update({
        where: { id: orgId },
        data: {
          name: organizationName || undefined,
          industry: industry || undefined,
          autoRecoveryEnabled: autoRecoveryEnabled !== undefined ? Boolean(autoRecoveryEnabled) : undefined,
        },
      });
    }

    // Update OrgSettings
    const settingsUpdate = {};
    if (retryWindowMinutes !== undefined) settingsUpdate.retryWindowMinutes = parseInt(retryWindowMinutes, 10);
    if (autoExecuteRecovery !== undefined) settingsUpdate.autoExecuteRecovery = Boolean(autoExecuteRecovery);
    if (minConfidenceThreshold !== undefined) settingsUpdate.minConfidenceThreshold = parseFloat(minConfidenceThreshold);
    if (enabledChannels !== undefined) settingsUpdate.enabledChannels = JSON.stringify(enabledChannels);
    if (slackWebhookUrl !== undefined) settingsUpdate.slackWebhookUrl = slackWebhookUrl;
    if (supportEmail !== undefined) settingsUpdate.supportEmail = supportEmail;
    if (webhookUrl !== undefined) settingsUpdate.webhookUrl = webhookUrl;

    const updatedSettings = await prisma.orgSettings.upsert({
      where: { organizationId: orgId },
      update: settingsUpdate,
      create: {
        organizationId: orgId,
        ...settingsUpdate,
      },
    });

    await recordAuditLog({
      organizationId: orgId,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'UPDATE_SETTINGS',
      entityType: 'SETTINGS',
      details: req.body,
    });

    let channelsList = ['WHATSAPP', 'SMS', 'EMAIL', 'WEBHOOK_RETRY'];
    try {
      channelsList = JSON.parse(updatedSettings.enabledChannels);
    } catch (e) {
      channelsList = ['WHATSAPP', 'SMS'];
    }

    res.json({
      success: true,
      message: 'Settings successfully updated',
      data: {
        ...updatedSettings,
        enabledChannels: channelsList,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function regenerateWebhookSecret(req, res, next) {
  try {
    const orgId = req.user.organizationId;
    const newSecret = 'whsec_rec_' + Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 8);

    const updatedSettings = await prisma.orgSettings.upsert({
      where: { organizationId: orgId },
      update: { webhookSecret: newSecret },
      create: {
        organizationId: orgId,
        webhookSecret: newSecret,
      },
    });

    await recordAuditLog({
      organizationId: orgId,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'REGENERATE_WEBHOOK_SECRET',
      entityType: 'SETTINGS',
    });

    res.json({
      success: true,
      webhookSecret: newSecret,
      message: 'New webhook secret generated successfully',
    });
  } catch (error) {
    next(error);
  }
}

async function inviteTeamMember(req, res, next) {
  try {
    const { name, email, role = 'ANALYST', password = 'Password@123' } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Name and email are required' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        role: ['ADMIN', 'ANALYST', 'SUPPORT'].includes(role.toUpperCase()) ? role.toUpperCase() : 'ANALYST',
        passwordHash,
        organizationId: req.user.organizationId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    await recordAuditLog({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'INVITE_USER',
      entityType: 'AUTH',
      entityId: user.id,
      details: { name: user.name, email: user.email, role: user.role },
    });

    res.status(201).json({
      success: true,
      message: `User ${user.name} added with role ${user.role}`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSettings,
  updateSettings,
  regenerateWebhookSecret,
  inviteTeamMember,
};
