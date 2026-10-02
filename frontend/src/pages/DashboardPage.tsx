import React, { useState, useEffect } from 'react';
import { analyticsApi, transactionsApi } from '../api/endpoints';
import { AnalyticsData, Transaction } from '../types';
import { StatCard } from '../components/common/StatCard';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { TableSkeleton } from '../components/common/Skeleton';
import { RevenueRecoveryChart } from '../components/charts/RevenueRecoveryChart';
import { FailureBreakdownChart } from '../components/charts/FailureBreakdownChart';
import { ChannelPerformanceChart } from '../components/charts/ChannelPerformanceChart';
import { PaymentMethodChart } from '../components/charts/PaymentMethodChart';
import { ActionModal } from '../components/recovery/ActionModal';
import { SimulateTxnModal } from '../components/recovery/SimulateTxnModal';
import { RecoveryScoreBadge } from '../components/recovery/RecoveryScoreBadge';
import { formatINR, formatDate, getStatusBadgeConfig } from '../utils/formatters';
import {
  TrendingUp,
  AlertOctagon,
  ShieldCheck,
  Zap,
  Clock,
  RefreshCw,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modals state
  const [selectedTxnForAction, setSelectedTxnForAction] = useState<Transaction | null>(null);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState<boolean>(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const [analyticsData, txnsData] = await Promise.all([
        analyticsApi.getOverview(timeRange),
        transactionsApi.list({ limit: 6, status: 'FAILED' }),
      ]);
      setAnalytics(analyticsData);
      setRecentTransactions(txnsData.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  if (isLoading && !analytics) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 bg-white rounded-xl border border-slate-200 p-5 animate-pulse" />
          ))}
        </div>
        <TableSkeleton rows={6} cols={5} />
      </div>
    );
  }

  const kpi = analytics?.kpi;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Revenue Recovery Command Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time deterministic recovery telemetry and autonomous win-back orchestration
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Time Filter Pills */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 text-xs font-semibold shadow-subtle">
            {['7d', '30d', '90d', 'all'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  timeRange === t
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            isLoading={isRefreshing}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>

          <Button
            variant="emerald"
            size="sm"
            onClick={() => setIsSimulateModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Inject Test Payment
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Recovered Revenue"
          value={formatINR(kpi?.totalRecoveredVolume)}
          subtitle={`${kpi?.recoveredTxnCount || 0} payments recovered`}
          change={{ value: '+18.4%', type: 'increase', label: 'vs last cycle' }}
          icon={<ShieldCheck className="w-5 h-5" />}
          iconBg="bg-emerald-50 text-emerald-700"
        />

        <StatCard
          title="Gross Failed Volume"
          value={formatINR(kpi?.totalGrossFailedVolume)}
          subtitle={`${kpi?.totalTxnCount || 0} total dropped payments`}
          icon={<AlertOctagon className="w-5 h-5" />}
          iconBg="bg-rose-50 text-rose-700"
        />

        <StatCard
          title="Recoverable Pipeline"
          value={formatINR(kpi?.recoverablePipelineVolume)}
          subtitle="Active recovery opportunities"
          icon={<TrendingUp className="w-5 h-5" />}
          iconBg="bg-blue-50 text-blue-700"
        />

        <StatCard
          title="Recovery Success Rate"
          value={`${kpi?.recoveryRate || 0}%`}
          subtitle="Deterministic engine accuracy"
          change={{ value: '+4.2%', type: 'increase' }}
          icon={<Zap className="w-5 h-5" />}
          iconBg="bg-amber-50 text-amber-700"
        />

        <StatCard
          title="Avg. Resolution Time"
          value={`${kpi?.avgRecoveryMinutes || 42} mins`}
          subtitle="Speed to recovery"
          icon={<Clock className="w-5 h-5" />}
          iconBg="bg-purple-50 text-purple-700"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Area Chart: Trend */}
        <div className="lg:col-span-8">
          <Card
            title="Revenue Recovery Trend"
            subtitle="Daily recovered revenue vs gross failed transaction volume"
            headerAction={
              <Link to="/analytics" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
                <span>Detailed Analytics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <RevenueRecoveryChart data={analytics?.trendData || []} height={280} />
          </Card>
        </div>

        {/* Failure Breakdown Bar Chart */}
        <div className="lg:col-span-4">
          <Card
            title="Failure Root Causes"
            subtitle="Volume and recovery rate by classification"
          >
            <FailureBreakdownChart data={analytics?.failureBreakdown || []} height={280} />
          </Card>
        </div>
      </div>

      {/* Second Tier Grid: Channels & Payment Methods */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <Card
            title="Channel Conversion Performance"
            subtitle="Win-back conversion efficiency by delivery channel"
          >
            <ChannelPerformanceChart data={analytics?.channelPerformance || []} />
          </Card>
        </div>

        <div className="lg:col-span-6">
          <Card
            title="Payment Method Resolution Matrix"
            subtitle="Recovery rate across UPI, Cards, NetBanking, and Mandates"
          >
            <PaymentMethodChart data={analytics?.paymentMethodBreakdown || []} />
          </Card>
        </div>
      </div>

      {/* Critical Recovery Action Queue */}
      <Card
        title="High-Priority Recovery Queue"
        subtitle="Unrecovered transactions prioritized by recovery probability and customer value"
        headerAction={
          <Link to="/transactions" className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1">
            <span>View All Transactions ({kpi?.totalTxnCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Transaction / Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Failure Reason</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Recovery Probability</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No active failed payments in queue! All transactions recovered.
                  </td>
                </tr>
              ) : (
                recentTransactions.map((txn) => {
                  const statusConfig = getStatusBadgeConfig(txn.status);
                  return (
                    <tr key={txn.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <Link to={`/transactions/${txn.id}`} className="font-semibold text-slate-900 hover:text-emerald-700 block">
                          {txn.externalTxnId}
                        </Link>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {txn.customer?.name} ({txn.customer?.businessName || txn.customer?.segment})
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {formatINR(txn.amount)}
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="font-medium text-slate-800 block truncate" title={txn.failureReason}>
                          {txn.failureReason}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {txn.rawFailureCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="neutral" size="sm">
                          {txn.paymentMethod.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        {txn.recommendation ? (
                          <RecoveryScoreBadge
                            probability={txn.recommendation.recoveryProbability}
                            priorityScore={txn.recommendation.priorityScore}
                            size="sm"
                          />
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="emerald"
                          size="xs"
                          onClick={() => setSelectedTxnForAction(txn)}
                          leftIcon={<Zap className="w-3 h-3" />}
                        >
                          Recover
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recovery Action Modal */}
      {selectedTxnForAction && (
        <ActionModal
          isOpen={!!selectedTxnForAction}
          onClose={() => setSelectedTxnForAction(null)}
          transaction={selectedTxnForAction}
          onSuccess={fetchData}
        />
      )}

      {/* Simulate Modal */}
      <SimulateTxnModal
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
        onCreated={fetchData}
      />
    </div>
  );
};
