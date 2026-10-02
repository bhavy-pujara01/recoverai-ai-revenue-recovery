import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { transactionsApi } from '../api/endpoints';
import { Transaction } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { Skeleton } from '../components/common/Skeleton';
import { ExplainabilityCard } from '../components/recovery/ExplainabilityCard';
import { RecoveryTimeline } from '../components/recovery/RecoveryTimeline';
import { ActionModal } from '../components/recovery/ActionModal';
import { formatINR, formatDate, getStatusBadgeConfig, getPaymentMethodLabel } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeft,
  Zap,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Building,
  CreditCard,
  Phone,
  Mail,
  FileText,
  AlertTriangle,
  History,
} from 'lucide-react';

export const TransactionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRecalculating, setIsRecalculating] = useState<boolean>(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState<boolean>(false);

  const fetchTransaction = async () => {
    if (!id) return;
    try {
      const data = await transactionsApi.getById(id);
      setTransaction(data);
    } catch (error) {
      console.error('Failed to load transaction details:', error);
      showToast({
        type: 'error',
        title: 'Transaction Not Found',
        message: 'Unable to retrieve transaction information.',
      });
      navigate('/transactions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransaction();
  }, [id]);

  const handleRecalculateRecommendation = async () => {
    if (!id) return;
    setIsRecalculating(true);
    try {
      const recommendation = await transactionsApi.generateRecommendation(id);
      setTransaction((prev) => (prev ? { ...prev, recommendation } : null));
      showToast({
        type: 'success',
        title: 'Recommendation Recalculated',
        message: 'Recovery intelligence scoring refreshed with latest parameters.',
      });
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Recalculation Failed',
        message: error.response?.data?.error || 'Failed to re-run recovery model.',
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleStatusUpdate = async (status: 'RECOVERED' | 'ABANDONED') => {
    if (!id) return;
    try {
      await transactionsApi.updateStatus(id, {
        status,
        note: `Status manually updated to ${status} via transaction console.`,
      });
      showToast({
        type: 'info',
        title: `Transaction Marked as ${status}`,
        message: 'Status updated and ledger state synchronized.',
      });
      fetchTransaction();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Status Update Failed',
        message: error.response?.data?.error || 'Could not update status.',
      });
    }
  };

  if (isLoading || !transaction) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const statusConfig = getStatusBadgeConfig(transaction.status);

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/transactions" className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight font-mono">
                {transaction.externalTxnId}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs font-semibold ${statusConfig.bg}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                {statusConfig.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Order ID: <span className="font-mono font-medium text-slate-700">{transaction.orderId}</span> • Created {formatDate(transaction.createdAt)}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecalculateRecommendation}
            isLoading={isRecalculating}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Re-run Intelligence
          </Button>

          {transaction.status !== 'RECOVERED' && (
            <Button
              variant="emerald"
              size="sm"
              onClick={() => setIsActionModalOpen(true)}
              leftIcon={<Zap className="w-3.5 h-3.5" />}
            >
              Execute Recovery
            </Button>
          )}

          {transaction.status !== 'RECOVERED' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusUpdate('RECOVERED')}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            >
              Mark Recovered
            </Button>
          )}

          {transaction.status !== 'ABANDONED' && transaction.status !== 'RECOVERED' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleStatusUpdate('ABANDONED')}
              className="text-rose-600 hover:bg-rose-50"
              leftIcon={<XCircle className="w-3.5 h-3.5" />}
            >
              Abandon
            </Button>
          )}
        </div>
      </div>

      {/* Failure Diagnostic Alert Banner */}
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/90 text-rose-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
        <div className="flex items-start gap-3">
          <div className="p-1.5 bg-rose-200/60 rounded-lg text-rose-700 shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold text-rose-950 text-sm">{transaction.failureReason}</p>
            <p className="text-rose-700 mt-0.5 font-mono">
              Raw Gateway Error Code: <strong>{transaction.rawFailureCode}</strong> • Classification: {transaction.failureCategory}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-right sm:border-l sm:border-rose-200 sm:pl-4">
          <span className="text-rose-700">Failed Volume</span>
          <div className="text-lg font-black text-rose-950">{formatINR(transaction.amount)}</div>
        </div>
      </div>

      {/* Main Grid: Left (Explainability & Timeline) / Right (Customer & Details) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 8 cols */}
        <div className="lg:col-span-8 space-y-6">
          {/* Explainability Card */}
          {transaction.recommendation ? (
            <ExplainabilityCard
              recommendation={transaction.recommendation}
              transaction={transaction}
            />
          ) : (
            <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-500">
              No recovery recommendation generated yet.{' '}
              <Button size="xs" variant="emerald" onClick={handleRecalculateRecommendation} className="ml-2">
                Generate Now
              </Button>
            </div>
          )}

          {/* Recovery Timeline */}
          <RecoveryTimeline transaction={transaction} />

          {/* Audit Trail */}
          {transaction.auditLogs && transaction.auditLogs.length > 0 && (
            <Card title="Transaction Audit Trail" subtitle="Immutable event logging for compliance and operations">
              <div className="space-y-3 text-xs">
                {transaction.auditLogs.map((log) => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900">{log.action.replace(/_/g, ' ')}</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Actor: <strong>{log.userName}</strong> ({log.userRole})
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{formatDate(log.createdAt)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: 4 cols */}
        <div className="lg:col-span-4 space-y-6">
          {/* Customer Profile Card */}
          <Card title="Customer Account" subtitle="Customer reliability & lifetime profile">
            <div className="space-y-3.5 text-xs">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-sm">
                  {transaction.customer.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/customers/${transaction.customer.id}`}
                    className="font-bold text-slate-900 text-sm hover:text-emerald-700 truncate block"
                  >
                    {transaction.customer.name}
                  </Link>
                  <p className="text-[11px] text-slate-500 truncate">{transaction.customer.businessName || 'Direct Consumer'}</p>
                </div>
                <Badge variant={transaction.customer.segment === 'ENTERPRISE' ? 'purple' : 'neutral'} size="sm">
                  {transaction.customer.segment}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{transaction.customer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{transaction.customer.phone}</span>
                </div>
              </div>

              {/* Customer Metrics */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Customer LTV</span>
                  <div className="font-bold text-slate-900 mt-0.5">{formatINR(transaction.customer.lifetimeValue)}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] uppercase font-semibold text-slate-500">Success Rate</span>
                  <div className="font-bold text-emerald-700 mt-0.5">{transaction.customer.recoveryRate}%</div>
                </div>
              </div>

              <Link to={`/customers/${transaction.customer.id}`} className="block pt-1">
                <Button variant="outline" size="xs" className="w-full">
                  View Full Customer Profile
                </Button>
              </Link>
            </div>
          </Card>

          {/* Payment Instrument Details */}
          <Card title="Payment Instrument" subtitle="Routing switch and issuer telemetry">
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Payment Instrument:</span>
                <span className="font-semibold text-slate-900">{getPaymentMethodLabel(transaction.paymentMethod)}</span>
              </div>

              {transaction.upiApp && (
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">UPI Application:</span>
                  <span className="font-semibold text-slate-900">{transaction.upiApp}</span>
                </div>
              )}

              {transaction.cardIssuer && (
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-500">Card Issuer Bank:</span>
                  <span className="font-semibold text-slate-900">{transaction.cardIssuer}</span>
                </div>
              )}

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Recovery Attempts:</span>
                <span className="font-semibold text-slate-900">
                  {transaction.attemptCount} of {transaction.maxAllowedAttempts} allowed
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Currency / Settlement:</span>
                <span className="font-mono font-semibold text-slate-900">INR (₹)</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Recovery Execution Modal */}
      <ActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        transaction={transaction}
        onSuccess={fetchTransaction}
      />
    </div>
  );
};
