import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  change?: {
    value: string;
    type: 'increase' | 'decrease' | 'neutral';
    label?: string;
  };
  icon?: React.ReactNode;
  iconBg?: string;
  badge?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  change,
  icon,
  iconBg = 'bg-slate-100 text-slate-700',
  badge,
  onClick,
  className = '',
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200/90 rounded-xl p-5 shadow-card hover:border-slate-300 transition-all duration-150 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 truncate">{title}</span>
            {badge}
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 mt-1.5">{value}</div>
        </div>
        {icon && (
          <div className={`p-2.5 rounded-lg shrink-0 ${iconBg}`}>
            {icon}
          </div>
        )}
      </div>

      {(change || subtitle) && (
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {change && (
            <div className="flex items-center gap-1">
              <span
                className={`inline-flex items-center font-medium ${
                  change.type === 'increase'
                    ? 'text-emerald-700'
                    : change.type === 'decrease'
                    ? 'text-rose-700'
                    : 'text-slate-500'
                }`}
              >
                {change.type === 'increase' ? (
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                ) : change.type === 'decrease' ? (
                  <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                ) : (
                  <Minus className="w-3.5 h-3.5 mr-0.5" />
                )}
                {change.value}
              </span>
              {change.label && <span className="text-slate-400 font-normal">{change.label}</span>}
            </div>
          )}
          {subtitle && <span className="text-slate-500 truncate ml-auto">{subtitle}</span>}
        </div>
      )}
    </div>
  );
};
