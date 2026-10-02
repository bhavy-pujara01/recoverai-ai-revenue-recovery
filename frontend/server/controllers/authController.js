const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { recordAuditLog } = require('../services/auditService');

const JWT_SECRET = process.env.JWT_SECRET || 'recoverai_secure_jwt_secret_token_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

async function register(req, res, next) {
  try {
    const { name, email, password, organizationName, role = 'ADMIN' } = req.body;

    if (!name || !email || !password || !organizationName) {
      return res.status(400).json({ success: false, error: 'Name, email, password, and organization name are required' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User with this email already exists' });
    }

    // Create Organization
    const slug = organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
    const org = await prisma.organization.create({
      data: {
        name: organizationName,
        slug,
        settings: {
          create: {
            retryWindowMinutes: 45,
            autoExecuteRecovery: false,
            minConfidenceThreshold: 75.0,
            enabledChannels: JSON.stringify(['WHATSAPP', 'SMS', 'EMAIL', 'WEBHOOK_RETRY']),
          },
        },
      },
    });

    // Hash Password
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash,
        role: role.toUpperCase(),
        organizationId: org.id,
      },
      include: { organization: true },
    });

    const token = jwt.sign({ userId: user.id, orgId: org.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    await recordAuditLog({
      organizationId: org.id,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'USER_REGISTER',
      entityType: 'AUTH',
      entityId: user.id,
      details: { email: user.email, organization: org.name },
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
          currency: org.currency,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { organization: true },
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id, orgId: user.organizationId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    await recordAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'AUTH',
      entityId: user.id,
      details: { email: user.email },
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug,
          currency: user.organization.currency,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getMe(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        organization: {
          include: {
            settings: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        organizationId: user.organizationId,
        organization: user.organization,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function demoLogin(req, res, next) {
  try {
    const { role = 'ADMIN' } = req.body;
    const targetRole = ['ADMIN', 'ANALYST', 'SUPPORT'].includes(role.toUpperCase()) ? role.toUpperCase() : 'ADMIN';

    // Find first user with that role or fallback to first user
    let user = await prisma.user.findFirst({
      where: { role: targetRole },
      include: { organization: true },
    });

    if (!user) {
      user = await prisma.user.findFirst({
        include: { organization: true },
      });
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'No demo users found. Please run seed script.' });
    }

    const token = jwt.sign({ userId: user.id, orgId: user.organizationId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    await recordAuditLog({
      organizationId: user.organizationId,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      action: 'DEMO_QUICK_LOGIN',
      entityType: 'AUTH',
      entityId: user.id,
      details: { role: user.role, email: user.email },
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          slug: user.organization.slug,
          currency: user.organization.currency,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  getMe,
  demoLogin,
};
