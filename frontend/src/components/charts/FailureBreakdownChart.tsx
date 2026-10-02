import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { AnalyticsFailureCategory } from '../../types';
import { formatINR, getFailureCategoryLabel } from '../../utils/formatters';

export interface FailureBreakdownChartProps {
  data: AnalyticsFailureCategory[];
  height?: number;
}

export const FailureBreakdownChart: React.FC<FailureBreakdownChartProps> = ({
  data,
  height = 260,
}) => {
  const chartData = data.map((d) => ({
    ...d,
    shortName: getFailureCategoryLabel(d.category).split(' ')[0] + '...',
    fullName: getFailureCategoryLabel(d.category),
  }));

  const colors = ['#0284c7', '#d97706', '#059669', '#8b5cf6', '#e11d48', '#64748b'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-modal text-xs space-y-1 border border-slate-700">
          <p className="font-semibold text-slate-200">{item.fullName}</p>
          <p className="text-slate-400">Total Volume: <strong className="text-white">{formatINR(item.totalAmount)}</strong> ({item.count} txns)</p>
          <p className="text-emerald-400">Recovered: <strong className="text-emerald-300">{formatINR(item.recoveredAmount)}</strong> ({item.recoveryRate}% rate)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis
            dataKey="shortName"
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#64748b', fontSize: 10 }}
            angle={-15}
            textAnchor="end"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickFormatter={(val) => formatINR(val, true)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="totalAmount" radius={[4, 4, 0, 0]}>
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
