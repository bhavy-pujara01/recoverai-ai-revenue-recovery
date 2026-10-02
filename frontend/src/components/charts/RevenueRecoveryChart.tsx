import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { AnalyticsTrendPoint } from '../../types';
import { formatINR } from '../../utils/formatters';

export interface RevenueRecoveryChartProps {
  data: AnalyticsTrendPoint[];
  height?: number;
}

export const RevenueRecoveryChart: React.FC<RevenueRecoveryChartProps> = ({
  data,
  height = 300,
}) => {
  const formattedData = data.map((item) => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-modal text-xs space-y-1.5 border border-slate-700">
          <p className="font-semibold text-slate-300">{label}</p>
          <div className="flex items-center justify-between gap-4 text-emerald-400">
            <span>Recovered Revenue:</span>
            <span className="font-bold">{formatINR(payload[0]?.value)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 text-rose-400">
            <span>Failed Revenue:</span>
            <span className="font-bold">{formatINR(payload[1]?.value)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="recoveredGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="failedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="formattedDate" tickLine={false} axisLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickFormatter={(val) => formatINR(val, true)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
          />
          <Area
            type="monotone"
            dataKey="recoveredAmount"
            name="Recovered Revenue (₹)"
            stroke="#059669"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#recoveredGrad)"
          />
          <Area
            type="monotone"
            dataKey="failedAmount"
            name="Gross Failed Volume (₹)"
            stroke="#f43f5e"
            strokeWidth={2}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#failedGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
