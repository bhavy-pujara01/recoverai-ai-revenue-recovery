import React from 'react';
import { AnalyticsPaymentMethod } from '../../types';
import { formatINR, getPaymentMethodLabel } from '../../utils/formatters';

export interface PaymentMethodChartProps {
  data: AnalyticsPaymentMethod[];
}

export const PaymentMethodChart: React.FC<PaymentMethodChartProps> = ({ data }) => {
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.method} className="flex items-center justify-between text-xs p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
          <div>
            <span className="font-semibold text-slate-800">{getPaymentMethodLabel(item.method)}</span>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {item.totalCount} failed attempts ({item.recoveredCount} recovered)
            </div>
          </div>
          <div className="text-right">
            <span className="font-bold text-slate-900 block">{formatINR(item.recoveredVolume)}</span>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 font-semibold px-1.5 py-0.2 rounded">
              {item.recoveryRate}% resolved
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};
