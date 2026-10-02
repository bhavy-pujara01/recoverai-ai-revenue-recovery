import React from 'react';
import { AnalyticsChannelPerformance } from '../../types';
import { formatINR, getChannelLabel } from '../../utils/formatters';
import { MessageSquare, RefreshCw, Smartphone, Mail, PhoneCall } from 'lucide-react';

export interface ChannelPerformanceChartProps {
  data: AnalyticsChannelPerformance[];
}

export const ChannelPerformanceChart: React.FC<ChannelPerformanceChartProps> = ({ data }) => {
  const getIcon = (ch: string) => {
    switch (ch) {
      case 'WHATSAPP':
        return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      case 'WEBHOOK_RETRY':
        return <RefreshCw className="w-4 h-4 text-blue-600" />;
      case 'SMS':
        return <Smartphone className="w-4 h-4 text-purple-600" />;
      case 'EMAIL':
        return <Mail className="w-4 h-4 text-amber-600" />;
      default:
        return <PhoneCall className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-3.5">
      {data.map((item) => (
        <div key={item.channel} className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 font-medium text-slate-800">
              {getIcon(item.channel)}
              <span>{getChannelLabel(item.channel)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-500 font-normal">
                {item.successfulAttempts}/{item.totalAttempts} converted
              </span>
              <span className="font-bold text-slate-900">{formatINR(item.recoveredAmount)}</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
                {item.conversionRate}%
              </span>
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(5, item.conversionRate))}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
