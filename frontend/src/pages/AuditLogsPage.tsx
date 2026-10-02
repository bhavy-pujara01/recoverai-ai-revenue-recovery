import React, { useState, useEffect } from 'react';
import { auditApi } from '../api/endpoints';
import { AuditLog } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { formatDate } from '../utils/formatters';
import { ScrollText, Search, ShieldCheck, User, Filter } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [search, setSearch] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await auditApi.list({
        page: pagination.page,
        limit: pagination.limit,
        search,
        action: actionFilter !== 'ALL' ? actionFilter : undefined,
        entityType: entityFilter !== 'ALL' ? entityFilter : undefined,
      });
      setLogs(res.data);
      setPagination(res.pagination);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [pagination.page, pagination.limit, actionFilter, entityFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((p) => ({ ...p, page: 1 }));
    fetchLogs();
  };

  const getActionBadge = (action: string) => {
    if (action.includes('SUCCESS') || action.includes('RECOVER')) {
      return <Badge variant="success" size="sm">{action.replace(/_/g, ' ')}</Badge>;
    }
    if (action.includes('FAIL') || action.includes('ABANDON')) {
      return <Badge variant="danger" size="sm">{action.replace(/_/g, ' ')}</Badge>;
    }
    if (action.includes('LOGIN') || action.includes('AUTH')) {
      return <Badge variant="info" size="sm">{action.replace(/_/g, ' ')}</Badge>;
    }
    return <Badge variant="neutral" size="sm">{action.replace(/_/g, ' ')}</Badge>;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
          Immutable Compliance & Audit Trail
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Comprehensive tamper-evident ledger of user sessions, recovery executions, campaigns, and configuration changes
        </p>
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
              placeholder="Search by user, action name, or entity ID..."
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
              setActionFilter('ALL');
              setEntityFilter('ALL');
              setPagination((p) => ({ ...p, page: 1 }));
            }}
          >
            Reset
          </Button>
        </form>

        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Entity Type</label>
            <select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-800 text-xs"
            >
              <option value="ALL">All Entities</option>
              <option value="TRANSACTION">Transaction</option>
              <option value="CAMPAIGN">Campaign</option>
              <option value="AUTH">Authentication</option>
              <option value="SETTINGS">Settings</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Action Type</label>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-800 text-xs"
            >
              <option value="ALL">All Actions</option>
              <option value="USER_LOGIN">User Login</option>
              <option value="EXECUTE_RECOVERY_SUCCESS">Recovery Success</option>
              <option value="EXECUTE_RECOVERY_FAILURE">Recovery Failure</option>
              <option value="GENERATE_RECOMMENDATION">Generate Recommendation</option>
              <option value="CREATE_CAMPAIGN">Create Campaign</option>
              <option value="LAUNCH_CAMPAIGN_COMPLETE">Launch Campaign</option>
              <option value="UPDATE_SETTINGS">Update Settings</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl shadow-card overflow-hidden">
        {isLoading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : logs.length === 0 ? (
          <EmptyState
            title="No audit records found"
            description="No system logs match the current search filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Actor / Role</th>
                  <th className="py-3 px-4">Entity Context</th>
                  <th className="py-3 px-4">Audit Details & Metadata</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-900 block">{log.userName}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{log.userRole}</span>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-medium text-slate-700 block">{log.entityType}</span>
                      {log.entityId && (
                        <span className="text-[10px] text-slate-400 font-mono">{log.entityId}</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 max-w-md">
                      <div className="bg-slate-50 p-2 rounded border border-slate-100 font-mono text-[11px] text-slate-700 truncate max-w-md">
                        {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {formatDate(log.createdAt)}
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
