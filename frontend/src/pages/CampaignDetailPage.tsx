import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { campaignsApi } from '../api/endpoints';
import { RecoveryCampaign } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { StatCard } from '../components/common/StatCard';
import { Skeleton } from '../components/common/Skeleton';
import { formatINR, formatDate, getChannelLabel, getActionLabel } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import {
  ArrowLeft,
  Megaphone,
  Play,
  CheckCircle2,
  Clock,
  Layers,
  Zap,
  TrendingUp,
  ShieldCheck,
  Send,
} from 'lucide-react';

export const CampaignDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const [campaign, setCampaign] = useState<RecoveryCampaign | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLaunching, setIsLaunching] = useState<boolean>(false);

  const fetchCampaign = async () => {
    if (!id) return;
    try {
      const data = await campaignsApi.getById(id);
      setCampaign(data);
    } catch (error) {
      console.error('Failed to load campaign:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const handleLaunch = async () => {
    if (!id) return;
    setIsLaunching(true);
    try {
      const res = await campaignsApi.launch(id);
      showToast({
        type: 'recovery',
        title: 'Campaign Simulation Completed',
        message: res.message,
      });
      fetchCampaign();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Launch Failed',
        message: error.response?.data?.error || 'Failed to execute campaign.',
      });
    } finally {
      setIsLaunching(false);
    }
  };

  if (isLoading || !campaign) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/campaigns"
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                {campaign.name}
              </h1>
              <Badge variant={campaign.status === 'COMPLETED' ? 'success' : campaign.status === 'RUNNING' ? 'warning' : 'default'} size="sm" dot>
                {campaign.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Created by {campaign.createdBy} • {formatDate(campaign.createdAt)}
            </p>
          </div>
        </div>

        {campaign.status !== 'COMPLETED' && (
          <Button
            variant="emerald"
            size="sm"
            onClick={handleLaunch}
            isLoading={isLaunching}
            leftIcon={<Play className="w-3.5 h-3.5 fill-white" />}
          >
            Launch Execution Simulation
          </Button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Recovered Revenue"
          value={formatINR(campaign.recoveredAmount)}
          subtitle="Rescued campaign volume"
          icon={<ShieldCheck className="w-5 h-5" />}
          iconBg="bg-emerald-50 text-emerald-700"
        />

        <StatCard
          title="Campaign Success Rate"
          value={`${campaign.successRate}%`}
          subtitle={`${campaign.recoveredCount} of ${campaign.processedCount || campaign.totalAudience} payments converted`}
          icon={<Zap className="w-5 h-5" />}
          iconBg="bg-blue-50 text-blue-700"
        />

        <StatCard
          title="Audience Processed"
          value={`${campaign.processedCount} / ${campaign.totalAudience}`}
          subtitle="Eligible failed payments"
          icon={<Layers className="w-5 h-5" />}
          iconBg="bg-purple-50 text-purple-700"
        />

        <StatCard
          title="Target Segment"
          value={campaign.targetSegment}
          subtitle={`Threshold: ${formatINR(campaign.minAmount)} – ${formatINR(campaign.maxAmount)}`}
          icon={<Megaphone className="w-5 h-5" />}
          iconBg="bg-amber-50 text-amber-700"
        />
      </div>

      {/* Workflow & Channel Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <Card title="Multi-Step Workflow Sequence" subtitle="Automated action escalation hierarchy">
            <div className="space-y-2.5 text-xs">
              {campaign.actionWorkflow && campaign.actionWorkflow.length > 0 ? (
                campaign.actionWorkflow.map((step, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-[10px]">
                        {step.step || idx + 1}
                      </span>
                      <span className="font-semibold text-slate-900">{getActionLabel(step.action)}</span>
                    </div>
                    <span className="text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                      Delay: {step.delayMinutes} mins
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 py-4 text-center">Standard autonomous recovery workflow applied.</p>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-6">
          <Card title="Enabled Channels" subtitle="Authorized communication routes">
            <div className="space-y-2 text-xs">
              {campaign.channels?.map((ch, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2.5 font-medium text-slate-800">
                  <Send className="w-4 h-4 text-emerald-600" />
                  <span>{getChannelLabel(ch)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Campaign Recovery Attempts Ledger */}
      <Card title="Campaign Recovery Execution Attempts" subtitle="Live dispatch log of recovery actions for this campaign" noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Transaction / Order</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campaign.attempts && campaign.attempts.length > 0 ? (
                campaign.attempts.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      <Link to={`/transactions/${att.transactionId}`} className="hover:text-emerald-700">
                        {att.transaction?.externalTxnId || att.transactionId}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      {att.transaction?.customer?.name || 'Customer'}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {formatINR(att.transaction?.amount || 0)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="neutral" size="sm">{getChannelLabel(att.channel)}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                          att.status === 'COMPLETED_PAYMENT'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {att.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {att.responseTimeSecs ? `${att.responseTimeSecs}s` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {formatDate(att.createdAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No execution attempts recorded for this campaign yet. Launch the simulation to process payments.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
