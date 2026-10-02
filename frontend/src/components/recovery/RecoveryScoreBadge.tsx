import React from 'react';
import { PriorityScore } from '../../types';
import { getPriorityBadgeConfig } from '../../utils/formatters';

export interface RecoveryScoreBadgeProps {
  probability: number;
  priorityScore: PriorityScore | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const RecoveryScoreBadge: React.FC<RecoveryScoreBadgeProps> = ({
  probability,
  priorityScore,
  size = 'md',
  showLabel = true,
}) => {
  const priorityConfig = getPriorityBadgeConfig(priorityScore);

  let probColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (probability < 40) {
    probColor = 'text-rose-700 bg-rose-50 border-rose-200';
  } else if (probability < 70) {
    probColor = 'text-amber-700 bg-amber-50 border-amber-200';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3.5 py-1.5',
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <span className={`font-semibold rounded-md border inline-flex items-center gap-1 ${probColor} ${sizeClasses[size]}`}>
        <span>{Math.round(probability)}%</span>
        {showLabel && <span className="font-normal text-[10px] opacity-75">recovery prob.</span>}
      </span>
      <span className={`font-medium rounded-md border text-[11px] px-2 py-0.5 ${priorityConfig.bg}`}>
        {priorityConfig.label}
      </span>
    </div>
  );
};
