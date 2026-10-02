import { TransactionStatus, PriorityScore, FailureCategory, PaymentMethod, RecoveryChannel, RecoveryAction } from '../types';

export function formatINR(amount: number | null | undefined, compact = false): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0';
  
  if (compact && Math.abs(amount) >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (compact && Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`;
  }
  if (compact && Math.abs(amount) >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}k`;
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string | null | undefined, includeTime = true): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '—';
    
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...(includeTime ? { hour: '2-digit', minute: '2-digit', hour12: true } : {}),
    };
    return new Intl.DateTimeFormat('en-IN', options).format(d);
  } catch (e) {
    return dateString;
  }
}

export function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return '—';
  const d = new Date(dateString);
  const now = new Date();
  const diffSecs = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffSecs < 60) return 'Just now';
  if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`;
  if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)}h ago`;
  if (diffSecs < 604800) return `${Math.floor(diffSecs / 86400)}d ago`;
  return formatDate(dateString, false);
}

export function getStatusBadgeConfig(status: TransactionStatus) {
  switch (status) {
    case 'RECOVERED':
      return {
        label: 'Recovered',
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        dot: 'bg-emerald-500',
      };
    case 'IN_RECOVERY':
      return {
        label: 'In Recovery',
        bg: 'bg-amber-50 border-amber-200 text-amber-700',
        dot: 'bg-amber-500 animate-pulse',
      };
    case 'FAILED':
      return {
        label: 'Failed',
        bg: 'bg-rose-50 border-rose-200 text-rose-700',
        dot: 'bg-rose-500',
      };
    case 'ABANDONED':
      return {
        label: 'Abandoned',
        bg: 'bg-slate-100 border-slate-300 text-slate-600',
        dot: 'bg-slate-400',
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-100 border-slate-200 text-slate-700',
        dot: 'bg-slate-400',
      };
  }
}

export function getPriorityBadgeConfig(priority: PriorityScore | string) {
  switch (priority) {
    case 'CRITICAL':
      return {
        label: 'Critical',
        bg: 'bg-red-100 text-red-800 border-red-200',
      };
    case 'HIGH':
      return {
        label: 'High Priority',
        bg: 'bg-amber-100 text-amber-800 border-amber-200',
      };
    case 'MEDIUM':
      return {
        label: 'Medium',
        bg: 'bg-blue-100 text-blue-800 border-blue-200',
      };
    case 'LOW':
      return {
        label: 'Low',
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
      };
    default:
      return {
        label: priority,
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
      };
  }
}

export function getFailureCategoryLabel(cat: FailureCategory | string): string {
  switch (cat) {
    case 'TRANSIENT_GATEWAY':
      return 'Gateway Timeout / Socket Error';
    case 'BANK_DECLINE':
      return 'Issuer Bank Authorization Declined';
    case 'CUSTOMER_DROPOFF':
      return '3DS OTP Drop-off / User Cancelled';
    case 'MANDATE_ISSUE':
      return 'eNACH Mandate Authorization Lapsed';
    case 'BALANCE_LIMIT':
      return 'Insufficient Funds / Card Limit Exceeded';
    case 'FRAUD_RESTRICTION':
      return 'Risk Shield / Fraud Velocity Block';
    default:
      return cat ? cat.replace(/_/g, ' ') : 'Unknown';
  }
}

export function getPaymentMethodLabel(method: PaymentMethod | string): string {
  switch (method) {
    case 'UPI_INTENT':
      return 'UPI Intent (App Deep-link)';
    case 'UPI_COLLECT':
      return 'UPI Collect Request';
    case 'CREDIT_CARD':
      return 'Credit Card';
    case 'DEBIT_CARD':
      return 'Debit Card';
    case 'NET_BANKING':
      return 'Net Banking';
    case 'ENACH_MANDATE':
      return 'eNACH Standing Mandate';
    case 'WALLET':
      return 'Prepaid Wallet';
    default:
      return method ? method.replace(/_/g, ' ') : 'Other';
  }
}

export function getChannelLabel(channel: RecoveryChannel | string): string {
  switch (channel) {
    case 'WHATSAPP':
      return 'WhatsApp Interactive Link';
    case 'SMS':
      return 'SMS Payment Link';
    case 'EMAIL':
      return 'Email Invoice Reminder';
    case 'WEBHOOK_RETRY':
      return 'Automated Gateway Webhook Retry';
    case 'IN_APP_POPUP':
      return 'In-App Modal Prompt';
    case 'AGENT_OUTREACH':
      return 'White-Glove Agent Outreach';
    default:
      return channel ? channel.replace(/_/g, ' ') : 'Direct';
  }
}

export function getActionLabel(action: RecoveryAction | string): string {
  switch (action) {
    case 'SMART_AUTO_RETRY':
      return 'Smart Gateway Auto-Retry';
    case 'WHATSAPP_PAYMENT_LINK':
      return 'Instant WhatsApp Deep-Link';
    case 'SMS_PAYMENT_LINK':
      return 'SMS Fallback Payment Link';
    case 'EMAIL_INVOICE_PROMPT':
      return 'Email Invoice & Mandate Prompt';
    case 'MANDATE_REAUTHORIZE':
      return 'eNACH Mandate Re-authorization';
    case 'MANUAL_CALL_ESCALATION':
      return 'Manual VIP Account Outreach';
    default:
      return action ? action.replace(/_/g, ' ') : 'Action';
  }
}
