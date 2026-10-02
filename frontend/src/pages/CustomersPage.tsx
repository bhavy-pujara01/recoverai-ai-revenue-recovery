import React, { useState, useEffect } from 'react';
import { customersApi } from '../api/endpoints';
import { Customer, CustomerSegment, ChurnRisk } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { formatINR, formatDate } from '../utils/formatters';
import { Search, Users, ShieldAlert, ArrowUpDown, Eye, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [search, setSearch] = useState<string>('');
  const [segment, setSegment] = useState<string>('ALL');
  const [churnRisk, setChurnRisk] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('lifetimeValue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await customersApi.list({
        page: pagination.page,
        limit: pagination.limit,
        search,
        segment,
        churnRisk,
        sortBy,
        sortOrder,
      });
      setCustomers(res.data);
      setPagination(res.pagination);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [pagination.page, pagination.limit, segment, churnRisk, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((p) => ({ ...p, page: 1 }));
    fetchCustomers();
  };

  const getRiskBadge = (risk: ChurnRisk) => {
    switch (risk) {
      case 'HIGH':
        return <Badge variant="danger" size="sm" dot>High Churn Risk</Badge>;
      case 'MEDIUM':
        return <Badge variant="warning" size="sm" dot>Medium Risk</Badge>;
      default:
        return <Badge variant="success" size="sm" dot>Low Risk</Badge>;
    }
  };

  const getSegmentBadge = (seg: CustomerSegment) => {
    switch (seg) {
      case 'ENTERPRISE':
        return <Badge variant="purple" size="sm">Enterprise Tier 1</Badge>;
      case 'MID_MARKET':
        return <Badge variant="info" size="sm">Mid-Market</Badge>;
      case 'SME':
        return <Badge variant="neutral" size="sm">SME</Badge>;
      default:
        return <Badge variant="default" size="sm">Retail</Badge>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Customer Intelligence & Lifetime Value
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor customer payment reliability, churn probability, and historical recovery conversion
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-card space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search by customer name, business, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs text-slate-900 bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
            />
          </div>
          <Button type="submit" variant="primary" size="sm">
            Search
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('');
              setSegment('ALL');
              setChurnRisk('ALL');
              setPagination((p) => ({ ...p, page: 1 }));
            }}
          >
            Reset
          </Button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Segment</label>
            <select
              value={segment}
              onChange={(e) => {
                setSegment(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-800 text-xs"
            >
              <option value="ALL">All Segments</option>
              <option value="ENTERPRISE">Enterprise</option>
              <option value="MID_MARKET">Mid-Market</option>
              <option value="SME">SME</option>
              <option value="RETAIL">Retail</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Churn Risk</label>
            <select
              value={churnRisk}
              onChange={(e) => {
                setChurnRisk(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-800 text-xs"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="LOW">Low Churn Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Sort By</label>
            <div className="flex gap-1">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 text-slate-800 text-xs"
              >
                <option value="lifetimeValue">Lifetime Value (LTV)</option>
                <option value="recoveryRate">Payment Success Rate</option>
                <option value="failedTransactions">Failed Count</option>
                <option value="totalTransactions">Total Orders</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1.5 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600"
                title="Toggle sort order"
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-card overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} cols={6} />
        ) : customers.length === 0 ? (
          <EmptyState
            title="No customers found"
            description="No customer accounts match the current filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Customer / Business</th>
                  <th className="py-3 px-4">Segment</th>
                  <th className="py-3 px-4">Lifetime Value (LTV)</th>
                  <th className="py-3 px-4">Payment Success Rate</th>
                  <th className="py-3 px-4">Failed Txns</th>
                  <th className="py-3 px-4">Churn Risk</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/customers/${c.id}`}
                        className="font-bold text-slate-900 hover:text-emerald-700 block"
                      >
                        {c.name}
                      </Link>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{c.businessName || 'Direct Consumer'}</span>
                        <span>•</span>
                        <span>{c.phone}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getSegmentBadge(c.segment)}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {formatINR(c.lifetimeValue)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-emerald-700">{c.recoveryRate.toFixed(1)}%</span>
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-600 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, c.recoveryRate)}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {c.successfulTransactions} of {c.totalTransactions} settled
                      </span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {c.failedTransactions > 0 ? (
                        <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-xs border border-rose-200">
                          {c.failedTransactions} failed
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">0</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getRiskBadge(c.churnRisk)}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link to={`/customers/${c.id}`}>
                        <Button variant="outline" size="xs" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                          View Profile
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={pagination.limit}
          onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
          onPageSizeChange={(limit) => setPagination((p) => ({ ...p, limit, page: 1 }))}
        />
      </div>
    </div>
  );
};
