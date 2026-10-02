export type UserRole = 'ADMIN' | 'ANALYST' | 'SUPPORT';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  organizationId: string;
  organization?: Organization;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  industry?: string;
  currency: string;
  timezone?: string;
  autoRecoveryEnabled: boolean;
  settings?: OrgSettings;
}

export interface OrgSettings {
  id?: string;
  webhookUrl?: string;
  webhookSecret?: string;
  retryWindowMinutes?: number;
  autoExecuteRecovery?: boolean;
  minConfidenceThreshold?: number;
  enabledChannels?: string[];
  slackWebhookUrl?: string;
  supportEmail?: string;
}

export type CustomerSegment = 'ENTERPRISE' | 'MID_MARKET' | 'SME' | 'RETAIL';
export type ChurnRisk = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Customer {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  phone: string;
  businessName?: string;
  segment: CustomerSegment;
  lifetimeValue: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  recoveryRate: number;
  churnRisk: ChurnRisk;
  paymentMethods: string[];
  transactions?: Transaction[];
  _count?: {
    transactions: number;
  };
  metrics?: {
    totalTxns: number;
    failedTxns: number;
    recoveredTxns: number;
    totalRecoveredValue: number;
    recoveryRate: number;
    failurePatterns: Record<string, number>;
  };
  createdAt: string;
  updatedAt: string;
}

export type TransactionStatus = 'FAILED' | 'IN_RECOVERY' | 'RECOVERED' | 'ABANDONED' | 'PENDING';
export type FailureCategory = 'TRANSIENT_GATEWAY' | 'BANK_DECLINE' | 'CUSTOMER_DROPOFF' | 'MANDATE_ISSUE' | 'BALANCE_LIMIT' | 'FRAUD_RESTRICTION';
export type PaymentMethod = 'UPI_INTENT' | 'UPI_COLLECT' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'NET_BANKING' | 'ENACH_MANDATE' | 'WALLET';
export type PriorityScore = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type RecoveryChannel = 'WHATSAPP' | 'SMS' | 'EMAIL' | 'WEBHOOK_RETRY' | 'IN_APP_POPUP' | 'AGENT_OUTREACH';
export type RecoveryAction = 'SMART_AUTO_RETRY' | 'WHATSAPP_PAYMENT_LINK' | 'SMS_PAYMENT_LINK' | 'EMAIL_INVOICE_PROMPT' | 'MANDATE_REAUTHORIZE' | 'MANUAL_CALL_ESCALATION';

export interface RecoveryRecommendation {
  id: string;
  transactionId: string;
  recoveryProbability: number;
  priorityScore: PriorityScore;
  priorityNumeric: number;
  expectedRecovery: number;
  recommendedAction: RecoveryAction;
  recommendedChannel: RecoveryChannel;
  optimalRetryWindow: string;
  explanationReasons: string[];
  confidenceScore: number;
  isExecuted: boolean;
  generatedAt: string;
}

export interface RecoveryAttempt {
  id: string;
  transactionId: string;
  campaignId?: string;
  channel: RecoveryChannel;
  actionType: RecoveryAction;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'OPENED' | 'CLICKED' | 'COMPLETED_PAYMENT' | 'FAILED' | 'TIMED_OUT';
  responseTimeSecs?: number;
  failureDetails?: string;
  executedBy: string;
  metadata?: string;
  createdAt: string;
  transaction?: Transaction;
}

export interface Transaction {
  id: string;
  organizationId: string;
  customerId: string;
  customer: Customer;
  externalTxnId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  failureCategory: FailureCategory;
  rawFailureCode: string;
  failureReason: string;
  paymentMethod: PaymentMethod;
  cardIssuer?: string;
  upiApp?: string;
  attemptCount: number;
  maxAllowedAttempts: number;
  lastAttemptAt?: string;
  recoveredAt?: string;
  metadata?: string;
  recommendation?: RecoveryRecommendation;
  recoveryAttempts?: RecoveryAttempt[];
  auditLogs?: AuditLog[];
  createdAt: string;
  updatedAt: string;
}

export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'PAUSED';

export interface CampaignWorkflowStep {
  step: number;
  action: RecoveryAction;
  delayMinutes: number;
}

export interface RecoveryCampaign {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  status: CampaignStatus;
  targetSegment: string;
  minAmount: number;
  maxAmount: number;
  channels: RecoveryChannel[];
  actionWorkflow: CampaignWorkflowStep[];
  totalAudience: number;
  processedCount: number;
  recoveredCount: number;
  recoveredAmount: number;
  successRate: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdBy: string;
  attempts?: RecoveryAttempt[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    attempts: number;
  };
}

export interface Notification {
  id: string;
  organizationId: string;
  title: string;
  message: string;
  type: 'RECOVERY_SUCCESS' | 'RECOVERY_FAILED' | 'CAMPAIGN_COMPLETED' | 'SYSTEM_ALERT' | 'CRITICAL_TXN';
  isRead: boolean;
  link?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId?: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
}

export interface AnalyticsKPI {
  totalGrossFailedVolume: number;
  totalRecoveredVolume: number;
  recoverablePipelineVolume: number;
  recoveryRate: number;
  avgRecoveryMinutes: number;
  totalTxnCount: number;
  recoveredTxnCount: number;
  failedTxnCount: number;
  inRecoveryTxnCount: number;
  abandonedTxnCount: number;
}

export interface AnalyticsTrendPoint {
  date: string;
  failed: number;
  recovered: number;
  failedAmount: number;
  recoveredAmount: number;
}

export interface AnalyticsFailureCategory {
  category: string;
  count: number;
  totalAmount: number;
  recoveredCount: number;
  recoveredAmount: number;
  recoveryRate: number;
}

export interface AnalyticsChannelPerformance {
  channel: string;
  totalAttempts: number;
  successfulAttempts: number;
  recoveredAmount: number;
  conversionRate: number;
}

export interface AnalyticsPaymentMethod {
  method: string;
  totalCount: number;
  recoveredCount: number;
  totalVolume: number;
  recoveredVolume: number;
  recoveryRate: number;
}

export interface AnalyticsSegmentPerformance {
  segment: string;
  totalTxns: number;
  recoveredTxns: number;
  volume: number;
  recoveredVolume: number;
  recoveryRate: number;
}

export interface AnalyticsData {
  kpi: AnalyticsKPI;
  trendData: AnalyticsTrendPoint[];
  failureBreakdown: AnalyticsFailureCategory[];
  channelPerformance: AnalyticsChannelPerformance[];
  paymentMethodBreakdown: AnalyticsPaymentMethod[];
  segmentPerformance: AnalyticsSegmentPerformance[];
}
