import React, { useState, useEffect } from 'react';
import { campaignsApi } from '../api/endpoints';
import { RecoveryCampaign, CampaignStatus } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import { formatINR, formatDate, getChannelLabel } from '../utils/formatters';
import { useToast } from '../context/ToastContext';
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  Zap,
  Eye,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const CampaignsPage: React.FC = () => {
  const { showToast } = useToast();
  const [campaigns, setCampaigns] = useState<RecoveryCampaign[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [launchingId, setLaunchingId] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const data = await campaignsApi.list({ status: statusFilter !== 'ALL' ? statusFilter : undefined });
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [statusFilter]);

  const handleLaunchCampaign = async (id: string, name: string) => {
    setLaunchingId(id);
    try {
      const res = await campaignsApi.launch(id);
      showToast({
        type: 'recovery',
        title: 'Campaign Simulation Executed',
        message: res.message,
      });
      fetchCampaigns();
    } catch (error: any) {
      showToast({
        type: 'error',
        title: 'Campaign Launch Failed',
        message: error.response?.data?.error || 'Error executing campaign sequence.',
      });
    } finally {
      setLaunchingId(null);
    }
  };

  const getStatusBadge = (status: CampaignStatus) => {
    switch (status) {
      case 'RUNNING':
        return <Badge variant="warning" size="sm" dot>Running</Badge>;
      case 'COMPLETED':
        return <Badge variant="success" size="sm" dot>Completed</Badge>;
      case 'SCHEDULED':
        return <Badge variant="info" size="sm">Scheduled</Badge>;
      case 'PAUSED':
        return <Badge variant="neutral" size="sm">Paused</Badge>;
      default:
        return <Badge variant="default" size="sm">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Targeted Recovery Campaigns
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Orchestrate autonomous, multi-channel payment win-back sequences by segment and threshold
          </p>
        </div>

        <Link to="/campaigns/create">
          <Button variant="emerald" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Create Recovery Campaign
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        {['ALL', 'RUNNING', 'COMPLETED', 'DRAFT', 'SCHEDULED'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === s
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Campaigns Grid */}
      {isLoading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : campaigns.length === 0 ? (
        <EmptyState
          title="No campaigns found"
          description="Create your first automated recovery campaign to recover failed payments at scale."
          actionLabel="Create Campaign"
          onAction={() => (window.location.href = '/campaigns/create')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {campaigns.map((camp) => (
            <div
              key={camp.id}
              className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-card hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{camp.name}</h3>
                  {getStatusBadge(camp.status)}
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                  {camp.description}
                </p>

                {/* Target & Threshold Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4 text-[11px]">
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                    Segment: {camp.targetSegment}
                  </span>
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                    {formatINR(camp.minAmount)} – {formatINR(camp.maxAmount)}
                  </span>
                </div>

                {/* Performance Metrics Box */}
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-2 text-xs mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Recovered Revenue:</span>
                    <span className="font-bold text-emerald-700 text-sm">{formatINR(camp.recoveredAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Recovery Rate:</span>
                    <span className="font-semibold text-slate-900">
                      {camp.successRate}% ({camp.recoveredCount}/{camp.processedCount || camp.totalAudience} payments)
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-1.5 rounded-full"
                      style={{ width: `${Math.min(100, camp.successRate)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <Link to={`/campaigns/${camp.id}`} className="text-xs font-semibold text-slate-700 hover:text-emerald-700 flex items-center gap-1">
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                {camp.status !== 'COMPLETED' && (
                  <Button
                    variant="emerald"
                    size="xs"
                    isLoading={launchingId === camp.id}
                    onClick={() => handleLaunchCampaign(camp.id, camp.name)}
                    leftIcon={<Play className="w-3 h-3 fill-white" />}
                  >
                    Launch Simulation
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
