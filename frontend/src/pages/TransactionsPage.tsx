import React, { useState, useEffect } from 'react';
import { transactionsApi } from '../api/endpoints';
import { Transaction, TransactionStatus } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { RecoveryScoreBadge } from '../components/recovery/RecoveryScoreBadge';
import { ActionModal } from '../components/recovery/ActionModal';
import { BatchActionModal } from '../components/recovery/BatchActionModal';
import { SimulateTxnModal } from '../components/recovery/SimulateTxnModal';
import { formatINR, formatDate, getStatusBadgeConfig } from '../utils/formatters';
import {
  Search,
  Filter,
  RefreshCw,
  Plus,
  Zap,
  Eye,
  SlidersHorizontal,
  Layers,
  ArrowUpDown,
  Download,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export const TransactionsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters state
  const [search, setSearch] = useState<string>(initialSearch);
  const [status, setStatus] = useState<string>('ALL');
  const [failureCategory, setFailureCategory] = useState<string>('ALL');
  const [paymentMethod, setPaymentMethod] = useState<string>('ALL');
  const [priority, setPriority] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Multi-select state for Batch Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [selectedTxnForAction, setSelectedTxnForAction] = useState<Transaction | null>(null);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState<boolean>(false);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await transactionsApi.list({
        page: pagination.page,
        limit: pagination.limit,
        search,
        status,
        failureCategory,
        paymentMethod,
        priority,
        sortBy,
        sortOrder,
      });
      setTransactions(res.data);
      setPagination(res.pagination);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [pagination.page, pagination.limit, status, failureCategory, paymentMethod, priority, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchTransactions();
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const activeUnrecovered = transactions
        .filter((t) => t.status !== 'RECOVERED')
        .map((t) => t.id);
      setSelectedIds(activeUnrecovered);
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const totalSelectedAmount = transactions
    .filter((t) => selectedIds.includes(t.id))
    .reduce((sum, t) => sum + t.amount, 0);

  const exportCSV = () => {
    const headers = ['Txn ID', 'Order ID', 'Customer', 'Email', 'Amount (INR)', 'Status', 'Failure Reason', 'Method', 'Date'];
    const rows = transactions.map((t) => [
      t.externalTxnId,
      t.orderId,
      t.customer?.name || '',
      t.customer?.email || '',
      t.amount,
      t.status,
      `"${t.failureReason.replace(/"/g, '""')}"`,
      t.paymentMethod,
      t.createdAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `recoverai_transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Transaction Recovery Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor, inspect, and trigger intelligent recovery across all payment gateway failures
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={exportCSV} leftIcon={<Download className="w-3.5 h-3.5" />}>
            Export CSV
          </Button>

          <Button
            variant="emerald"
            size="sm"
            onClick={() => setIsSimulateModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Inject Failed Payment
          </Button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-card space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search by transaction ID, order ID, customer name, email..."
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
              setStatus('ALL');
              setFailureCategory('ALL');
              setPaymentMethod('ALL');
              setPriority('ALL');
              setPagination((p) => ({ ...p, page: 1 }));
            }}
          >
            Reset
          </Button>
        </form>

        {/* Dropdown Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-800 text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="FAILED">Failed</option>
              <option value="IN_RECOVERY">In Recovery</option>
              <option value="RECOVERED">Recovered</option>
              <option value="ABANDONED">Abandoned</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Failure Classification</label>
            <select
              value={failureCategory}
              onChange={(e) => {
                setFailureCategory(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-800 text-xs"
            >
              <option value="ALL">All Categories</option>
              <option value="TRANSIENT_GATEWAY">Transient Gateway</option>
              <option value="BANK_DECLINE">Issuer Bank Decline</option>
              <option value="BALANCE_LIMIT">Balance / Limit Exceeded</option>
              <option value="CUSTOMER_DROPOFF">3DS OTP Drop-off</option>
              <option value="MANDATE_ISSUE">Mandate Lapsed</option>
              <option value="FRAUD_RESTRICTION">Fraud Velocity Block</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-800 text-xs"
            >
              <option value="ALL">All Methods</option>
              <option value="UPI_INTENT">UPI Intent</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="DEBIT_CARD">Debit Card</option>
              <option value="NET_BANKING">Net Banking</option>
              <option value="ENACH_MANDATE">eNACH Mandate</option>
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
                <option value="createdAt">Date Created</option>
                <option value="amount">Amount</option>
                <option value="priority">Priority</option>
                <option value="probability">Recovery Prob</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1.5 border border-slate-200 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600"
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                <ArrowUpDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Action Floating Banner */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-modal flex items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              <strong>{selectedIds.length}</strong> transactions selected ({formatINR(totalSelectedAmount)})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="xs" onClick={() => setSelectedIds([])} className="text-slate-300 hover:text-white">
              Deselect All
            </Button>
            <Button
              variant="emerald"
              size="xs"
              onClick={() => setIsBatchModalOpen(true)}
              leftIcon={<Zap className="w-3.5 h-3.5" />}
            >
              Batch Recover Selected
            </Button>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-card overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} cols={7} />
        ) : transactions.length === 0 ? (
          <EmptyState
            title="No transactions found"
            description="No transactions match your search query and filters. Try adjusting your filter parameters or inject a test payment."
            actionLabel="Inject Test Payment"
            onAction={() => setIsSimulateModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4 w-8">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        selectedIds.length > 0 &&
                        selectedIds.length ===
                          transactions.filter((t) => t.status !== 'RECOVERED').length
                      }
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="py-3 px-4">Transaction / Order</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Failure Reason</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Recovery Score</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((txn) => {
                  const statusConfig = getStatusBadgeConfig(txn.status);
                  const isSelected = selectedIds.includes(txn.id);

                  return (
                    <tr
                      key={txn.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          disabled={txn.status === 'RECOVERED'}
                          checked={isSelected}
                          onChange={() => handleToggleSelect(txn.id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-30"
                        />
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <Link
                          to={`/transactions/${txn.id}`}
                          className="font-bold text-slate-900 hover:text-emerald-700 block"
                        >
                          {txn.externalTxnId}
                        </Link>
                        <span className="text-[10px] text-slate-400">{txn.orderId}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <Link
                          to={`/customers/${txn.customerId}`}
                          className="font-semibold text-slate-900 hover:underline block truncate"
                        >
                          {txn.customer?.name}
                        </Link>
                        <span className="text-[10px] text-slate-500">
                          {txn.customer?.businessName || txn.customer?.segment}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {formatINR(txn.amount)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold ${statusConfig.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                          {statusConfig.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <span className="font-medium text-slate-800 block truncate" title={txn.failureReason}>
                          {txn.failureReason}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {txn.rawFailureCode}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge variant="neutral" size="sm">
                          {txn.paymentMethod.replace(/_/g, ' ')}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {txn.recommendation ? (
                          <RecoveryScoreBadge
                            probability={txn.recommendation.recoveryProbability}
                            priorityScore={txn.recommendation.priorityScore}
                            size="sm"
                            showLabel={false}
                          />
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {formatDate(txn.createdAt)}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link to={`/transactions/${txn.id}`}>
                            <Button variant="ghost" size="xs" title="View details">
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </Link>

                          {txn.status !== 'RECOVERED' && (
                            <Button
                              variant="emerald"
                              size="xs"
                              onClick={() => setSelectedTxnForAction(txn)}
                              leftIcon={<Zap className="w-3 h-3" />}
                            >
                              Recover
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={pagination.limit}
          onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
          onPageSizeChange={(limit) => setPagination((p) => ({ ...p, limit, page: 1 }))}
        />
      </div>

      {/* Single Action Modal */}
      {selectedTxnForAction && (
        <ActionModal
          isOpen={!!selectedTxnForAction}
          onClose={() => setSelectedTxnForAction(null)}
          transaction={selectedTxnForAction}
          onSuccess={fetchTransactions}
        />
      )}

      {/* Batch Recovery Modal */}
      <BatchActionModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        selectedIds={selectedIds}
        totalSelectedAmount={totalSelectedAmount}
        onSuccess={() => {
          setSelectedIds([]);
          fetchTransactions();
        }}
      />

      {/* Simulate Modal */}
      <SimulateTxnModal
        isOpen={isSimulateModalOpen}
        onClose={() => setIsSimulateModalOpen(false)}
        onCreated={fetchTransactions}
      />
    </div>
  );
};
