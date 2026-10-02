const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { calculateRecoveryScore } = require('../src/services/recoveryEngine');

const prisma = new PrismaClient();

async function main() {
  console.log('[RecoverAI Seed] Starting database seeding with realistic Indian Fintech data...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.recoveryAttempt.deleteMany();
  await prisma.recoveryRecommendation.deleteMany();
  await prisma.recoveryCampaign.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.orgSettings.deleteMany();
  await prisma.user.deleteMany();
  await prisma.organization.deleteMany();

  // 1. Create Organization
  const org = await prisma.organization.create({
    data: {
      name: 'NexusPay Technologies Pvt Ltd',
      industry: 'B2B SaaS & Recurring Billing',
      slug: 'nexuspay-tech',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      autoRecoveryEnabled: true,
      settings: {
        create: {
          webhookUrl: 'https://api.nexuspay.tech/v1/webhooks/recoverai',
          webhookSecret: 'whsec_rec_live_9a82b1c4e7f3',
          retryWindowMinutes: 45,
          autoExecuteRecovery: true,
          minConfidenceThreshold: 78.0,
          enabledChannels: JSON.stringify(['WHATSAPP', 'SMS', 'EMAIL', 'WEBHOOK_RETRY']),
          slackWebhookUrl: 'https://hooks.slack.com/services/T048A/B091C/nexuspay-alerts',
          supportEmail: 'recovery-ops@nexuspay.tech',
        },
      },
    },
  });

  // 2. Create Users with Hashed Passwords
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
  const analystPasswordHash = await bcrypt.hash('Analyst@123', 10);
  const supportPasswordHash = await bcrypt.hash('Support@123', 10);

  const adminUser = await prisma.user.create({
    data: {
      name: 'Aditya Verma',
      email: 'admin@recoverai.in',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      organizationId: org.id,
    },
  });

  const analystUser = await prisma.user.create({
    data: {
      name: 'Priya Nair',
      email: 'analyst@recoverai.in',
      passwordHash: analystPasswordHash,
      role: 'ANALYST',
      organizationId: org.id,
    },
  });

  const supportUser = await prisma.user.create({
    data: {
      name: 'Karthik Sundaram',
      email: 'support@recoverai.in',
      passwordHash: supportPasswordHash,
      role: 'SUPPORT',
      organizationId: org.id,
    },
  });

  console.log('[RecoverAI Seed] Created users: admin@recoverai.in, analyst@recoverai.in, support@recoverai.in');

  // 3. Create Customers
  const customerData = [
    {
      name: 'Rahul Sharma',
      email: 'rahul.sharma@bharatlogix.io',
      phone: '+91 98201 44521',
      businessName: 'BharatLogix SaaS',
      segment: 'ENTERPRISE',
      lifetimeValue: 284500,
      totalTransactions: 48,
      successfulTransactions: 44,
      failedTransactions: 4,
      recoveryRate: 91.7,
      churnRisk: 'LOW',
      paymentMethods: JSON.stringify(['ENACH_MANDATE', 'CREDIT_CARD', 'UPI_INTENT']),
    },
    {
      name: 'Sneha Kulkarni',
      email: 'sneha@quickcart.in',
      phone: '+91 97112 88490',
      businessName: 'QuickCart Retail Network',
      segment: 'ENTERPRISE',
      lifetimeValue: 195000,
      totalTransactions: 36,
      successfulTransactions: 33,
      failedTransactions: 3,
      recoveryRate: 91.6,
      churnRisk: 'LOW',
      paymentMethods: JSON.stringify(['CREDIT_CARD', 'NET_BANKING']),
    },
    {
      name: 'Amit Patel',
      email: 'amit.patel@freshfarms.co.in',
      phone: '+91 94230 19854',
      businessName: 'FreshFarms Direct',
      segment: 'MID_MARKET',
      lifetimeValue: 88400,
      totalTransactions: 22,
      successfulTransactions: 19,
      failedTransactions: 3,
      recoveryRate: 86.4,
      churnRisk: 'LOW',
      paymentMethods: JSON.stringify(['UPI_INTENT', 'DEBIT_CARD']),
    },
    {
      name: 'Ananya Deshmukh',
      email: 'ananya@eduveda.online',
      phone: '+91 99870 33412',
      businessName: 'EduVeda Learning Solutions',
      segment: 'MID_MARKET',
      lifetimeValue: 74200,
      totalTransactions: 18,
      successfulTransactions: 15,
      failedTransactions: 3,
      recoveryRate: 83.3,
      churnRisk: 'MEDIUM',
      paymentMethods: JSON.stringify(['UPI_COLLECT', 'CREDIT_CARD']),
    },
    {
      name: 'Vikramaditya Rao',
      email: 'vikram.rao@zephyrtech.in',
      phone: '+91 98450 67219',
      businessName: 'Zephyr Tech Labs',
      segment: 'ENTERPRISE',
      lifetimeValue: 340000,
      totalTransactions: 54,
      successfulTransactions: 50,
      failedTransactions: 4,
      recoveryRate: 92.5,
      churnRisk: 'LOW',
      paymentMethods: JSON.stringify(['ENACH_MANDATE', 'NET_BANKING', 'CREDIT_CARD']),
    },
    {
      name: 'Deepa Menon',
      email: 'deepa.menon@healthpulse.care',
      phone: '+91 98471 29013',
      businessName: 'HealthPulse Clinics',
      segment: 'SME',
      lifetimeValue: 42500,
      totalTransactions: 14,
      successfulTransactions: 11,
      failedTransactions: 3,
      recoveryRate: 78.5,
      churnRisk: 'MEDIUM',
      paymentMethods: JSON.stringify(['UPI_INTENT', 'CREDIT_CARD']),
    },
    {
      name: 'Rohan Verma',
      email: 'rohan@urbanstyle.store',
      phone: '+91 96540 88214',
      businessName: 'UrbanStyle Fashion House',
      segment: 'SME',
      lifetimeValue: 36000,
      totalTransactions: 12,
      successfulTransactions: 9,
      failedTransactions: 3,
      recoveryRate: 75.0,
      churnRisk: 'HIGH',
      paymentMethods: JSON.stringify(['UPI_INTENT', 'WALLET']),
    },
    {
      name: 'Pooja Agarwal',
      email: 'pooja.agarwal@finedge.in',
      phone: '+91 93120 44902',
      businessName: 'FinEdge Capital Advisory',
      segment: 'MID_MARKET',
      lifetimeValue: 112000,
      totalTransactions: 28,
      successfulTransactions: 25,
      failedTransactions: 3,
      recoveryRate: 89.2,
      churnRisk: 'LOW',
      paymentMethods: JSON.stringify(['NET_BANKING', 'CREDIT_CARD']),
    },
    {
      name: 'Rajesh Singhania',
      email: 'rajesh@singhaniasteel.com',
      phone: '+91 98300 77124',
      businessName: 'Singhania Industrial Infra',
      segment: 'ENTERPRISE',
      lifetimeValue: 460000,
      totalTransactions: 60,
      successfulTransactions: 56,
      failedTransactions: 4,
      recoveryRate: 93.3,
      churnRisk: 'LOW',
      paymentMethods: JSON.stringify(['ENACH_MANDATE', 'NET_BANKING']),
    },
    {
      name: 'Tanvi Bhatia',
      email: 'tanvi@zendeskindia.co',
      phone: '+91 98110 55239',
      businessName: 'ZenDesk Automation Partners',
      segment: 'SME',
      lifetimeValue: 29800,
      totalTransactions: 10,
      successfulTransactions: 7,
      failedTransactions: 3,
      recoveryRate: 70.0,
      churnRisk: 'MEDIUM',
      paymentMethods: JSON.stringify(['UPI_INTENT', 'CREDIT_CARD']),
    },
    {
      name: 'Arvind Subramanian',
      email: 'arvind.sub@cybershield.in',
      phone: '+91 94440 18273',
      businessName: 'CyberShield Security Ops',
      segment: 'MID_MARKET',
      lifetimeValue: 98000,
      totalTransactions: 24,
      successfulTransactions: 21,
      failedTransactions: 3,
      recoveryRate: 87.5,
      churnRisk: 'LOW',
      paymentMethods: JSON.stringify(['CREDIT_CARD', 'ENACH_MANDATE']),
    },
    {
      name: 'Meera Joshi',
      email: 'meera.joshi@skyroute.in',
      phone: '+91 98220 99401',
      businessName: 'SkyRoute Logistics',
      segment: 'SME',
      lifetimeValue: 31200,
      totalTransactions: 9,
      successfulTransactions: 6,
      failedTransactions: 3,
      recoveryRate: 66.7,
      churnRisk: 'HIGH',
      paymentMethods: JSON.stringify(['UPI_COLLECT', 'DEBIT_CARD']),
    },
  ];

  const createdCustomers = [];
  for (const c of customerData) {
    const cust = await prisma.customer.create({
      data: {
        ...c,
        organizationId: org.id,
      },
    });
    createdCustomers.push(cust);
  }

  console.log(`[RecoverAI Seed] Created ${createdCustomers.length} realistic customer profiles.`);

  // 4. Create Transactions (Failed, In Recovery, Recovered, Abandoned)
  const failureScenarios = [
    {
      category: 'TRANSIENT_GATEWAY',
      code: 'ERR_GW_TIMEOUT_504',
      reason: 'Gateway Timeout (504 Gateway Timeout on Acquirer Switch)',
      method: 'UPI_INTENT',
      upiApp: 'Google Pay',
      cardIssuer: null,
    },
    {
      category: 'BANK_DECLINE',
      code: 'ERR_BANK_AUTH_51',
      reason: 'Issuer Bank Declined (Do Not Honor / Card Switch Inactive)',
      method: 'CREDIT_CARD',
      upiApp: null,
      cardIssuer: 'HDFC Bank',
    },
    {
      category: 'BALANCE_LIMIT',
      code: 'ERR_INSUFFICIENT_FUNDS_51',
      reason: 'Insufficient Account Balance in Linked Bank Account',
      method: 'UPI_INTENT',
      upiApp: 'PhonePe',
      cardIssuer: null,
    },
    {
      category: 'CUSTOMER_DROPOFF',
      code: 'ERR_3DS_OTP_TIMEOUT',
      reason: '3DS OTP Verification Expired (Customer Authentication Drop-off)',
      method: 'CREDIT_CARD',
      upiApp: null,
      cardIssuer: 'ICICI Bank',
    },
    {
      category: 'MANDATE_ISSUE',
      code: 'ERR_ENACH_MANDATE_LAPSED',
      reason: 'eNACH Standing Mandate Authorization Lapsed by Issuing Bank',
      method: 'ENACH_MANDATE',
      upiApp: null,
      cardIssuer: 'State Bank of India',
    },
    {
      category: 'TRANSIENT_GATEWAY',
      code: 'ERR_SOCKET_HANGUP',
      reason: 'Payment Gateway Processor Socket Closed Prematurely',
      method: 'NET_BANKING',
      upiApp: null,
      cardIssuer: 'Axis Bank',
    },
    {
      category: 'BALANCE_LIMIT',
      code: 'ERR_DAILY_LIMIT_EXCEEDED',
      reason: 'Card Daily Domestic Spending Limit Exceeded',
      method: 'DEBIT_CARD',
      upiApp: null,
      cardIssuer: 'Kotak Mahindra Bank',
    },
    {
      category: 'FRAUD_RESTRICTION',
      code: 'ERR_RISK_VELOCITY_BLOCK',
      reason: 'High Velocity Risk Shield Triggered (Issuer Fraud Shield)',
      method: 'CREDIT_CARD',
      upiApp: null,
      cardIssuer: 'Standard Chartered',
    },
    {
      category: 'CUSTOMER_DROPOFF',
      code: 'ERR_UPI_USER_CANCELLED',
      reason: 'Customer Dismissed UPI Intent Payment Notification in CRED',
      method: 'UPI_INTENT',
      upiApp: 'CRED',
      cardIssuer: null,
    },
  ];

  const transactionAmounts = [1499, 2850, 4999, 7999, 12500, 18750, 24999, 49999, 85000, 3200, 6490, 14999, 38500, 9999, 5499];

  const statuses = ['FAILED', 'IN_RECOVERY', 'RECOVERED', 'FAILED', 'RECOVERED', 'IN_RECOVERY', 'FAILED', 'ABANDONED', 'RECOVERED', 'FAILED'];

  const createdTransactions = [];
  const now = Date.now();

  for (let i = 0; i < 35; i++) {
    const cust = createdCustomers[i % createdCustomers.length];
    const scenario = failureScenarios[i % failureScenarios.length];
    const amount = transactionAmounts[i % transactionAmounts.length];
    const status = statuses[i % statuses.length];

    // Create realistic staggered timestamps over the past 14 days
    const hoursAgo = Math.floor(Math.random() * 320) + 1;
    const createdAt = new Date(now - hoursAgo * 3600 * 1000);
    const recoveredAt = status === 'RECOVERED' ? new Date(createdAt.getTime() + (Math.floor(Math.random() * 180) + 15) * 60 * 1000) : null;
    const attemptCount = status === 'RECOVERED' ? 1 : (status === 'IN_RECOVERY' ? 1 : (status === 'ABANDONED' ? 3 : 0));

    const externalTxnId = `txn_in_${Math.random().toString(36).substring(2, 9)}`;
    const orderId = `ord_ind_${Math.random().toString(36).substring(2, 8)}`;

    const txn = await prisma.transaction.create({
      data: {
        organizationId: org.id,
        customerId: cust.id,
        externalTxnId,
        orderId,
        amount,
        currency: 'INR',
        status,
        failureCategory: scenario.category,
        rawFailureCode: scenario.code,
        failureReason: scenario.reason,
        paymentMethod: scenario.method,
        cardIssuer: scenario.cardIssuer,
        upiApp: scenario.upiApp,
        attemptCount,
        maxAllowedAttempts: 3,
        lastAttemptAt: attemptCount > 0 ? new Date(createdAt.getTime() + 45 * 60 * 1000) : null,
        recoveredAt,
        createdAt,
      },
    });

    // Compute deterministic recommendation
    const score = calculateRecoveryScore(txn, cust);

    const recommendation = await prisma.recoveryRecommendation.create({
      data: {
        transactionId: txn.id,
        recoveryProbability: score.recoveryProbability,
        priorityScore: score.priorityScore,
        priorityNumeric: score.priorityNumeric,
        expectedRecovery: score.expectedRecovery,
        recommendedAction: score.recommendedAction,
        recommendedChannel: score.recommendedChannel,
        optimalRetryWindow: score.optimalRetryWindow,
        explanationReasons: JSON.stringify(score.explanationReasons),
        confidenceScore: score.confidenceScore,
        isExecuted: status === 'RECOVERED' || status === 'IN_RECOVERY',
        generatedAt: createdAt,
      },
    });

    // If recovered or in recovery, create attempt record
    if (status === 'RECOVERED' || status === 'IN_RECOVERY' || status === 'ABANDONED') {
      await prisma.recoveryAttempt.create({
        data: {
          transactionId: txn.id,
          channel: score.recommendedChannel,
          actionType: score.recommendedAction,
          status: status === 'RECOVERED' ? 'COMPLETED_PAYMENT' : (status === 'ABANDONED' ? 'FAILED' : 'SENT'),
          responseTimeSecs: Math.floor(Math.random() * 8) + 2,
          executedBy: 'RecoverAI Autonomous Engine',
          failureDetails: status === 'ABANDONED' ? 'Max retry attempts exceeded without customer authorization.' : null,
          metadata: JSON.stringify({
            gatewayRef: `gw_ret_${Math.random().toString(36).substring(2, 9)}`,
            channelDelivered: true,
          }),
          createdAt: new Date(createdAt.getTime() + 30 * 60 * 1000),
        },
      });
    }

    createdTransactions.push(txn);
  }

  console.log(`[RecoverAI Seed] Created ${createdTransactions.length} transactions with deterministic recommendations.`);

  // 5. Create Recovery Campaigns
  const campaign1 = await prisma.recoveryCampaign.create({
    data: {
      organizationId: org.id,
      name: 'Enterprise High-Value Gateway Recovery Blitz',
      description: 'Autonomous multi-channel recovery sequence for failed transactions above ₹20,000 from Enterprise accounts.',
      status: 'RUNNING',
      targetSegment: 'ENTERPRISE',
      minAmount: 20000,
      maxAmount: 500000,
      channels: JSON.stringify(['WHATSAPP', 'EMAIL', 'WEBHOOK_RETRY']),
      actionWorkflow: JSON.stringify([
        { step: 1, action: 'SMART_AUTO_RETRY', delayMinutes: 15 },
        { step: 2, action: 'WHATSAPP_PAYMENT_LINK', delayMinutes: 60 },
        { step: 3, action: 'EMAIL_INVOICE_PROMPT', delayMinutes: 240 },
      ]),
      totalAudience: 12,
      processedCount: 10,
      recoveredCount: 8,
      recoveredAmount: 184500,
      successRate: 80.0,
      startedAt: new Date(now - 48 * 3600 * 1000),
      createdBy: adminUser.name,
    },
  });

  const campaign2 = await prisma.recoveryCampaign.create({
    data: {
      organizationId: org.id,
      name: 'UPI Drop-off WhatsApp Instant Win-Back',
      description: 'Trigger instant interactive WhatsApp payment links for UPI 3DS timeouts and user cancellations.',
      status: 'COMPLETED',
      targetSegment: 'ALL',
      minAmount: 1000,
      maxAmount: 25000,
      channels: JSON.stringify(['WHATSAPP', 'SMS']),
      actionWorkflow: JSON.stringify([
        { step: 1, action: 'WHATSAPP_PAYMENT_LINK', delayMinutes: 5 },
        { step: 2, action: 'SMS_PAYMENT_LINK', delayMinutes: 30 },
      ]),
      totalAudience: 24,
      processedCount: 24,
      recoveredCount: 19,
      recoveredAmount: 78950,
      successRate: 79.2,
      startedAt: new Date(now - 96 * 3600 * 1000),
      completedAt: new Date(now - 72 * 3600 * 1000),
      createdBy: analystUser.name,
    },
  });

  const campaign3 = await prisma.recoveryCampaign.create({
    data: {
      organizationId: org.id,
      name: 'SME Mandate Renewal Re-authorization',
      description: 'Automated email and in-app re-authorization prompts for lapsed eNACH subscription mandates.',
      status: 'DRAFT',
      targetSegment: 'SME',
      minAmount: 2500,
      maxAmount: 50000,
      channels: JSON.stringify(['EMAIL', 'SMS']),
      actionWorkflow: JSON.stringify([
        { step: 1, action: 'MANDATE_REAUTHORIZE', delayMinutes: 120 },
      ]),
      totalAudience: 8,
      createdBy: adminUser.name,
    },
  });

  console.log('[RecoverAI Seed] Created 3 recovery campaigns.');

  // 6. Create Notifications
  const notificationSamples = [
    {
      title: 'Payment Successfully Recovered',
      message: 'Recovered ₹24,999 from Rahul Sharma (BharatLogix SaaS) via WhatsApp payment link.',
      type: 'RECOVERY_SUCCESS',
      link: `/transactions/${createdTransactions[0].id}`,
    },
    {
      title: 'High-Value Payment Failed',
      message: '₹85,000 transaction failed for Vikramaditya Rao (Zephyr Tech Labs) — Transient Gateway Timeout.',
      type: 'CRITICAL_TXN',
      link: `/transactions/${createdTransactions[1]?.id || createdTransactions[0].id}`,
    },
    {
      title: 'Campaign Completed',
      message: "Campaign 'UPI Drop-off WhatsApp Instant Win-Back' finished with 79.2% recovery rate (₹78,950 recovered).",
      type: 'CAMPAIGN_COMPLETED',
      link: `/campaigns/${campaign2.id}`,
    },
    {
      title: 'Payment Successfully Recovered',
      message: 'Recovered ₹12,500 from Sneha Kulkarni via Smart Auto-Retry at gateway clearing window.',
      type: 'RECOVERY_SUCCESS',
      link: `/transactions/${createdTransactions[2]?.id || createdTransactions[0].id}`,
    },
  ];

  for (const n of notificationSamples) {
    await prisma.notification.create({
      data: {
        organizationId: org.id,
        title: n.title,
        message: n.message,
        type: n.type,
        link: n.link,
        isRead: false,
      },
    });
  }

  // 7. Create Audit Logs
  const auditSamples = [
    {
      userName: 'Aditya Verma',
      userRole: 'ADMIN',
      action: 'USER_LOGIN',
      entityType: 'AUTH',
      details: JSON.stringify({ email: 'admin@recoverai.in', method: 'password' }),
    },
    {
      userName: 'RecoverAI Engine',
      userRole: 'SYSTEM',
      action: 'EXECUTE_RECOVERY_SUCCESS',
      entityType: 'TRANSACTION',
      entityId: createdTransactions[0].id,
      details: JSON.stringify({ amount: 24999, channel: 'WHATSAPP', customer: 'Rahul Sharma' }),
    },
    {
      userName: 'Priya Nair',
      userRole: 'ANALYST',
      action: 'LAUNCH_CAMPAIGN_COMPLETE',
      entityType: 'CAMPAIGN',
      entityId: campaign2.id,
      details: JSON.stringify({ name: campaign2.name, recoveredAmount: 78950 }),
    },
    {
      userName: 'Aditya Verma',
      userRole: 'ADMIN',
      action: 'UPDATE_SETTINGS',
      entityType: 'SETTINGS',
      details: JSON.stringify({ autoExecuteRecovery: true, minConfidenceThreshold: 78.0 }),
    },
  ];

  for (const a of auditSamples) {
    await prisma.auditLog.create({
      data: {
        organizationId: org.id,
        userName: a.userName,
        userRole: a.userRole,
        action: a.action,
        entityType: a.entityType,
        entityId: a.entityId,
        details: a.details,
      },
    });
  }

  console.log('[RecoverAI Seed] Database seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('[RecoverAI Seed Error]:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
