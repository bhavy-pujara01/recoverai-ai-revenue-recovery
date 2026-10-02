import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { customersApi } from '../api/endpoints';
import { Customer, Transaction } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { Skeleton } from '../components/common/Skeleton';
import { ActionModal } from '../components/recovery/ActionModal';
import { formatINR, formatDate, getStatusBadgeConfig, getFailureCategoryLabel } from '../utils/formatters';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building,
  TrendingUp,
  ShieldAlert,
  CreditCard,
  Zap,
  CheckCircle2,
  Clock,
  History,
} from 'lucide-react';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTxnForAction, setSelectedTxnForAction] = useState<Transaction | null>(null);

  const fetchCustomer = async () => {
    if (!id) return;
    try {
      const data = await customersApi.getById(id);
      setCustomer(data);
    } catch (error) {
      console.error('Failed to load customer:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  if (isLoading || !customer) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  const metrics = customer.metrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/customers"
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                {customer.name}
              </h1>
              <Badge variant={customer.segment === 'ENTERPRISE' ? 'purple' : 'neutral'} size="sm">
                {customer.segment}
              </Badge>
              <Badge variant={customer.churnRisk === 'HIGH' ? 'danger' : 'success'} size="sm" dot>
                {customer.churnRisk} Churn Risk
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1 font-medium text-slate-700">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                {customer.businessName || 'Direct Consumer'}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {customer.email}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {customer.phone}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Customer Lifetime Value"
          value={formatINR(customer.lifetimeValue)}
          subtitle="Cumulative paid volume"
          icon={<TrendingUp className="w-5 h-5" />}
          iconBg="bg-emerald-50 text-emerald-700"
        />

        <StatCard
          title="Payment Success Rate"
          value={`${customer.recoveryRate.toFixed(1)}%`}
          subtitle={`${customer.successfulTransactions} successful transactions`}
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBg="bg-blue-50 text-blue-700"
        />

        <StatCard
          title="Total Recovered"
          value={formatINR(metrics?.totalRecoveredValue || 0)}
          subtitle={`${metrics?.recoveredTxns || 0} rescued transactions`}
          icon={<Zap className="w-5 h-5" />}
          iconBg="bg-amber-50 text-amber-700"
        />

        <StatCard
          title="Failed Drop-offs"
          value={`${customer.failedTransactions}`}
          subtitle="Transactions needing attention"
          icon={<ShieldAlert className="w-5 h-5" />}
          iconBg="bg-rose-50 text-rose-700"
        />
      </div>

      {/* Payment Methods & Historical Failure Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4">
          <Card title="Saved Payment Instruments" subtitle="Registered customer payment methods">
            <div className="space-y-2 text-xs">
              {customer.paymentMethods?.map((pm, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2.5 font-medium text-slate-800">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>{pm.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-8">
          <Card title="Historical Failure Diagnosis" subtitle="Distribution of past payment decline reasons">
            <div className="space-y-2.5 text-xs">
              {metrics?.failurePatterns && Object.keys(metrics.failurePatterns).length > 0 ? (
                Object.entries(metrics.failurePatterns).map(([pattern, count]) => (
                  <div key={pattern} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-900">{getFailureCategoryLabel(pattern)}</span>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">{pattern}</p>
                    </div>
                    <span className="font-bold text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200">
                      {count} event{count > 1 ? 's' : ''}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 py-4 text-center">No failure pattern history recorded for this customer.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Customer Transactions History Table */}
      <Card title="Payment & Recovery History" subtitle="Chronological ledger of transactions for this account" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Txn ID / Order</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Failure Reason</th>
                <th className="py-3 px-4">Instrument</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customer.transactions?.map((t) => {
                const statusConfig = getStatusBadgeConfig(t.status);
                return (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <Link to={`/transactions/${t.id}`} className="hover:text-emerald-700">
                        {t.externalTxnId}
                      </Link>
                      <span className="text-[10px] text-slate-400 block font-normal">{t.orderId}</span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {formatINR(t.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${statusConfig.bg}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate" title={t.failureReason}>
                      {t.failureReason}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="neutral" size="sm">{t.paymentMethod.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {formatDate(t.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {t.status !== 'RECOVERED' ? (
                        <Button
                          variant="emerald"
                          size="xs"
                          onClick={() => setSelectedTxnForAction(t)}
                          leftIcon={<Zap className="w-3 h-3" />}
                        >
                          Recover
                        </Button>
                      ) : (
                        <Link to={`/transactions/${t.id}`}>
                          <Button variant="ghost" size="xs">View</Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Action Modal */}
      {selectedTxnForAction && (
        <ActionModal
          isOpen={!!selectedTxnForAction}
          onClose={() => setSelectedTxnForAction(null)}
          transaction={selectedTxnForAction}
          onSuccess={fetchCustomer}
        />
      )}
    </div>
  );
};
