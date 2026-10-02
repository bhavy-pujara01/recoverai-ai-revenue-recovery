import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../api/endpoints';
import { AnalyticsData } from '../types';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { Button } from '../components/common/Button';
import { RevenueRecoveryChart } from '../components/charts/RevenueRecoveryChart';
import { FailureBreakdownChart } from '../components/charts/FailureBreakdownChart';
import { ChannelPerformanceChart } from '../components/charts/ChannelPerformanceChart';
import { PaymentMethodChart } from '../components/charts/PaymentMethodChart';
import { formatINR, getFailureCategoryLabel } from '../utils/formatters';
import {
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Zap,
  Clock,
  RefreshCw,
  Layers,
  ArrowUpRight,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const data = await analyticsApi.getOverview(timeRange);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const kpi = analytics?.kpi;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Revenue Recovery Analytics & Insights
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deep-dive into payment failure distributions, recovery efficiency, and channel conversion dynamics
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 text-xs font-semibold shadow-subtle">
            {['7d', '30d', '90d', 'all'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  timeRange === t
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={fetchAnalytics} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Recovered Revenue"
          value={formatINR(kpi?.totalRecoveredVolume)}
          subtitle={`${kpi?.recoveredTxnCount || 0} successfully settled`}
          icon={<ShieldCheck className="w-5 h-5" />}
          iconBg="bg-emerald-50 text-emerald-700"
        />

        <StatCard
          title="Gross Failed Volume"
          value={formatINR(kpi?.totalGrossFailedVolume)}
          subtitle={`${kpi?.totalTxnCount || 0} total gateway drops`}
          icon={<TrendingUp className="w-5 h-5" />}
          iconBg="bg-rose-50 text-rose-700"
        />

        <StatCard
          title="Recovery Conversion"
          value={`${kpi?.recoveryRate || 0}%`}
          subtitle="Deterministic engine win-rate"
          icon={<Zap className="w-5 h-5" />}
          iconBg="bg-blue-50 text-blue-700"
        />

        <StatCard
          title="Avg. Recovery Speed"
          value={`${kpi?.avgRecoveryMinutes || 42} mins`}
          subtitle="Median turnaround window"
          icon={<Clock className="w-5 h-5" />}
          iconBg="bg-purple-50 text-purple-700"
        />
      </div>

      {/* Main Trend Chart */}
      <Card title="Revenue Recovery & Failed Volume Timeline" subtitle="Daily aggregated transaction telemetry and settlement performance">
        <RevenueRecoveryChart data={analytics?.trendData || []} height={320} />
      </Card>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <Card title="Failure Root Cause Distribution" subtitle="Volume and resolution rate by error classification">
            <FailureBreakdownChart data={analytics?.failureBreakdown || []} height={280} />
          </Card>
        </div>

        <div className="lg:col-span-6">
          <Card title="Channel Win-Back Conversion" subtitle="Effectiveness across WhatsApp, SMS, Email, and Webhook Retries">
            <ChannelPerformanceChart data={analytics?.channelPerformance || []} />
          </Card>
        </div>
      </div>

      {/* Customer Segment Performance & Payment Instruments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Segment Recovery Table */}
        <div className="lg:col-span-6">
          <Card title="Customer Segment Recovery Matrix" subtitle="Recovery rate and rescued revenue by customer tier">
            <div className="space-y-3 text-xs">
              {analytics?.segmentPerformance?.map((seg) => (
                <div key={seg.segment} className="p-3 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{seg.segment}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {seg.recoveredTxns} of {seg.totalTxns} payments recovered ({formatINR(seg.volume)} total)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-700 block text-sm">{formatINR(seg.recoveredVolume)}</span>
                    <span className="text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold">
                      {seg.recoveryRate}% resolved
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Payment Methods */}
        <div className="lg:col-span-6">
          <Card title="Payment Method Recovery Efficiency" subtitle="Settlement efficiency across UPI, Cards, NetBanking, and Mandates">
            <PaymentMethodChart data={analytics?.paymentMethodBreakdown || []} />
          </Card>
        </div>
      </div>
    </div>
  );
};
