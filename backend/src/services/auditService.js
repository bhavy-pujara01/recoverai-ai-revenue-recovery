const prisma = require('../config/db');

async function recordAuditLog({
  organizationId,
  userId = null,
  userName = 'System Engine',
  userRole = 'SYSTEM',
  action,
  entityType,
  entityId = null,
  details = {},
  ipAddress = '127.0.0.1',
}) {
  try {
    const log = await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        userName,
        userRole,
        action,
        entityType,
        entityId,
        details: typeof details === 'string' ? details : JSON.stringify(details),
        ipAddress,
      },
    });
    return log;
  } catch (error) {
    console.error('Failed to record audit log:', error);
    return null;
  }
}

module.exports = {
  recordAuditLog,
};
