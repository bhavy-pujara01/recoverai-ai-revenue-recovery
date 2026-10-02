const prisma = require('../config/db');

async function createNotification({ organizationId, userId = null, title, message, type = 'RECOVERY_SUCCESS', link = null, metadata = {} }) {
  try {
    const notification = await prisma.notification.create({
      data: {
        organizationId,
        userId,
        title,
        message,
        type,
        link,
        metadata: JSON.stringify(metadata),
      },
    });
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
}

module.exports = {
  createNotification,
};
