const prisma = require('../config/db');
const { recordAuditLog } = require('../services/auditService');

async function listCustomers(req, res, next) {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      segment,
      churnRisk,
      sortBy = 'lifetimeValue',
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
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } },
        { businessName: { contains: search } },
      ];
    }

    if (segment && segment !== 'ALL') {
      where.segment = segment;
    }

    if (churnRisk && churnRisk !== 'ALL') {
      where.churnRisk = churnRisk;
    }

    const orderBy = { [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc' };

    const [total, customers] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          _count: {
            select: { transactions: true },
          },
        },
      }),
    ]);

    // Parse paymentMethods JSON safely
    const formatted = customers.map(c => {
      let methods = [];
      try {
        methods = JSON.parse(c.paymentMethods);
      } catch (e) {
        methods = [];
      }
      return { ...c, paymentMethods: methods };
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

async function getCustomerById(req, res, next) {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findFirst({
      where: {
        id,
        organizationId: req.user.organizationId,
      },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          include: {
            recommendation: true,
            recoveryAttempts: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    let methods = [];
    try {
      methods = JSON.parse(customer.paymentMethods);
    } catch (e) {
      methods = [];
    }

    // Compute customer recovery metrics
    const totalTxns = customer.transactions.length;
    const failedTxns = customer.transactions.filter(t => t.status === 'FAILED' || t.status === 'IN_RECOVERY' || t.status === 'ABANDONED').length;
    const recoveredTxns = customer.transactions.filter(t => t.status === 'RECOVERED').length;
    const totalRecoveredValue = customer.transactions
      .filter(t => t.status === 'RECOVERED')
      .reduce((sum, t) => sum + t.amount, 0);

    const failurePatterns = {};
    customer.transactions.forEach(t => {
      if (t.failureCategory) {
        failurePatterns[t.failureCategory] = (failurePatterns[t.failureCategory] || 0) + 1;
      }
    });

    res.json({
      success: true,
      data: {
        ...customer,
        paymentMethods: methods,
        metrics: {
          totalTxns,
          failedTxns,
          recoveredTxns,
          totalRecoveredValue,
          recoveryRate: failedTxns + recoveredTxns > 0 ? Math.round((recoveredTxns / (failedTxns + recoveredTxns)) * 100) : 100,
          failurePatterns,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listCustomers,
  getCustomerById,
};
