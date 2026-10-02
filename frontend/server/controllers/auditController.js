const prisma = require('../config/db');

async function listAuditLogs(req, res, next) {
  try {
    const {
      page = 1,
      limit = 20,
      action,
      entityType,
      search,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const take = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * take;

    const where = {
      organizationId: req.user.organizationId,
    };

    if (action && action !== 'ALL') {
      where.action = action;
    }

    if (entityType && entityType !== 'ALL') {
      where.entityType = entityType;
    }

    if (search) {
      where.OR = [
        { userName: { contains: search } },
        { action: { contains: search } },
        { entityType: { contains: search } },
        { entityId: { contains: search } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const formatted = logs.map(l => {
      let details = {};
      try {
        details = JSON.parse(l.details);
      } catch (e) {
        details = { raw: l.details };
      }
      return { ...l, details };
    });

    res.json({
      success: true,
      data: formatted,
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

module.exports = {
  listAuditLogs,
};
