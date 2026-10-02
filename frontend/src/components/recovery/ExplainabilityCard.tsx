import React from 'react';
import { RecoveryRecommendation, Transaction } from '../../types';
import { formatINR, getActionLabel, getChannelLabel } from '../../utils/formatters';
import { Brain, CheckCircle2, Clock, Zap, MessageSquare, ShieldCheck, HelpCircle } from 'lucide-react';
import { RecoveryScoreBadge } from './RecoveryScoreBadge';

export interface ExplainabilityCardProps {
  recommendation: RecoveryRecommendation;
  transaction: Transaction;
  className?: string;
}

export const ExplainabilityCard: React.FC<ExplainabilityCardProps> = ({
  recommendation,
  transaction,
  className = '',
}) => {
  return (
    <div className={`bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-card ${className}`}>
      {/* Header */}
      <div className="bg-slate-900 text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight">Explainable Recovery Intelligence</h3>
            <p className="text-xs text-slate-400">Deterministic scoring & channel routing engine</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <RecoveryScoreBadge
            probability={recommendation.recoveryProbability}
            priorityScore={recommendation.priorityScore}
            size="md"
          />
        </div>
      </div>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-slate-50/50 border-b border-slate-100">
        <div className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Recommended Action</span>
          <div className="flex items-center gap-1.5 mt-1 text-sm font-bold text-slate-900">
            <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{getActionLabel(recommendation.recommendedAction)}</span>
          </div>
        </div>

        <div className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Target Channel</span>
          <div className="flex items-center gap-1.5 mt-1 text-sm font-bold text-slate-900">
            <MessageSquare className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{getChannelLabel(recommendation.recommendedChannel)}</span>
          </div>
        </div>

        <div className="p-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Expected Recovery</span>
          <div className="flex items-center gap-1.5 mt-1 text-sm font-bold text-emerald-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{formatINR(recommendation.expectedRecovery)}</span>
            <span className="text-xs font-normal text-slate-500">of {formatINR(transaction.amount)}</span>
          </div>
        </div>
      </div>

      {/* Optimal Window Banner */}
      <div className="px-5 py-3 bg-amber-50/70 border-b border-amber-100/80 flex items-center gap-2 text-xs text-amber-900">
        <Clock className="w-4 h-4 text-amber-700 shrink-0" />
        <span className="font-semibold">Optimal Execution Window:</span>
        <span className="text-amber-800">{recommendation.optimalRetryWindow}</span>
      </div>

      {/* Explainability Bullets */}
      <div className="p-5">
        <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <HelpCircle className="w-4 h-4 text-slate-400" />
          <span>Why this recommendation was reached:</span>
        </div>

        <ul className="space-y-2.5">
          {recommendation.explanationReasons?.map((reason, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>

        {/* Confidence metric */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Model Confidence: {recommendation.confidenceScore || 88.5}%</span>
          <span>Engine: RecoverAI v2.4 (Deterministic Determinant Tree)</span>
        </div>
      </div>
    </div>
  );
};
