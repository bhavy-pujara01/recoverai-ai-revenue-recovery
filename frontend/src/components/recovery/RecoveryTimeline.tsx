import React from 'react';
import { Transaction } from '../../types';
import { formatDate, getChannelLabel, getActionLabel, formatINR } from '../../utils/formatters';
import { AlertCircle, CheckCircle2, Brain, Send, Clock, XCircle, ChevronRight } from 'lucide-react';

export interface RecoveryTimelineProps {
  transaction: Transaction;
  className?: string;
}

export const RecoveryTimeline: React.FC<RecoveryTimelineProps> = ({
  transaction,
  className = '',
}) => {
  const attempts = transaction.recoveryAttempts || [];

  return (
    <div className={`bg-white border border-slate-200/90 rounded-xl p-5 shadow-card ${className}`}>
      <h4 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-slate-500" />
        <span>Payment & Recovery Timeline</span>
      </h4>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {/* Step 1: Initial Payment Failure */}
        <div className="relative">
          <div className="absolute -left-[27px] top-0 p-1 bg-rose-100 text-rose-600 rounded-full border-2 border-white shadow-subtle">
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-900">Payment Failed ({formatINR(transaction.amount)})</span>
              <span className="text-[11px] text-slate-400">{formatDate(transaction.createdAt)}</span>
            </div>
            <p className="text-xs text-rose-700 bg-rose-50/70 p-2 rounded-md border border-rose-100 mt-1 font-mono">
              {transaction.rawFailureCode}: {transaction.failureReason}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Method: <strong className="text-slate-700">{transaction.paymentMethod}</strong>
              {transaction.upiApp && ` (${transaction.upiApp})`}
              {transaction.cardIssuer && ` (${transaction.cardIssuer})`}
            </p>
          </div>
        </div>

        {/* Step 2: AI Intelligence Recommendation */}
        {transaction.recommendation && (
          <div className="relative">
            <div className="absolute -left-[27px] top-0 p-1 bg-blue-100 text-blue-600 rounded-full border-2 border-white shadow-subtle">
              <Brain className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">Recovery Intelligence Generated</span>
                <span className="text-[11px] text-slate-400">{formatDate(transaction.recommendation.generatedAt)}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Calculated <strong className="text-slate-900">{Math.round(transaction.recommendation.recoveryProbability)}% recovery probability</strong>.
                Recommended action: <strong className="text-slate-900">{getActionLabel(transaction.recommendation.recommendedAction)}</strong> via{' '}
                <strong className="text-slate-900">{getChannelLabel(transaction.recommendation.recommendedChannel)}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Recovery Attempts */}
        {attempts.map((attempt, index) => {
          const isSuccess = attempt.status === 'COMPLETED_PAYMENT';
          return (
            <div key={attempt.id || index} className="relative">
              <div
                className={`absolute -left-[27px] top-0 p-1 rounded-full border-2 border-white shadow-subtle ${
                  isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {isSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900">
                    Recovery Attempt #{attempts.length - index} ({getChannelLabel(attempt.channel)})
                  </span>
                  <span className="text-[11px] text-slate-400">{formatDate(attempt.createdAt)}</span>
                </div>
                <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      isSuccess
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {attempt.status.replace(/_/g, ' ')}
                  </span>
                  <span>Executed by {attempt.executedBy}</span>
                  {attempt.responseTimeSecs && <span className="text-slate-400">• Latency: {attempt.responseTimeSecs}s</span>}
                </div>
                {attempt.failureDetails && (
                  <p className="text-[11px] text-rose-600 mt-1">{attempt.failureDetails}</p>
                )}
              </div>
            </div>
          );
        })}

        {/* Final Status */}
        {transaction.status === 'RECOVERED' && (
          <div className="relative">
            <div className="absolute -left-[27px] top-0 p-1 bg-emerald-600 text-white rounded-full border-2 border-white shadow-subtle">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800">Revenue Recovered Successfully</span>
                <span className="text-[11px] text-emerald-700">{formatDate(transaction.recoveredAt)}</span>
              </div>
              <p className="text-xs text-emerald-700 mt-0.5">
                Total recovered: <strong>{formatINR(transaction.amount)}</strong>. Transaction marked settled in ledger.
              </p>
            </div>
          </div>
        )}

        {transaction.status === 'ABANDONED' && (
          <div className="relative">
            <div className="absolute -left-[27px] top-0 p-1 bg-slate-400 text-white rounded-full border-2 border-white shadow-subtle">
              <XCircle className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-700">Recovery Abandoned</span>
              <p className="text-xs text-slate-500 mt-0.5">Max recovery attempts reached. Moved to archived churn loss.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
