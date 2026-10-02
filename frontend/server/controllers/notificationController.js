const prisma = require('../config/db');

async function listNotifications(req, res, next) {
  try {
    const { unreadOnly } = req.query;

    const where = {
      organizationId: req.user.organizationId,
    };

    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        organizationId: req.user.organizationId,
        isRead: false,
      },
    });

    const formatted = notifications.map(n => {
      let meta = {};
      try {
        meta = JSON.parse(n.metadata);
      } catch (e) {
        meta = {};
      }
      return { ...n, metadata: meta };
    });

    res.json({
      success: true,
      data: formatted,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
}

async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    await prisma.notification.updateMany({
      where: {
        organizationId: req.user.organizationId,
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listNotifications,
  markAsRead,
  markAllAsRead,
};
