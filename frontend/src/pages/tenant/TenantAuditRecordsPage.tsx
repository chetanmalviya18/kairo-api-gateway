import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAuditRecords, type AuditRecordResponse } from '@/features/routes/routeApi'
import { ShieldAlert, Search, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'

export default function TenantAuditRecordsPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const {
    data: records,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['tenant-audit-records'],
    queryFn: getAuditRecords,
  })

  const filtered = records?.filter((r) => {
    const q = searchTerm.toLowerCase()
    return (
      r.action.toLowerCase().includes(q) ||
      r.actor.toLowerCase().includes(q) ||
      r.resourceType.toLowerCase().includes(q) ||
      (r.resourceId && r.resourceId.toLowerCase().includes(q)) ||
      (r.details && r.details.toLowerCase().includes(q)) ||
      (r.correlationId && r.correlationId.toLowerCase().includes(q))
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Control Plane Audit Records</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Audit trail of configuration modifications and administrative actions
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-medium border border-border bg-card hover:bg-accent px-3 py-2 rounded-md transition shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Filter by action, actor, resource ID, or correlation ID…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-input rounded-md pl-9 pr-4 py-2 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Audit Table */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
            Loading audit records…
          </div>
        ) : !filtered || filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
            <ShieldAlert size={28} className="text-muted-foreground/60" />
            <p>No audit records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-muted-foreground font-semibold">
                  <th className="text-left px-4 py-3">Timestamp</th>
                  <th className="text-left px-4 py-3">Actor</th>
                  <th className="text-left px-4 py-3">Action</th>
                  <th className="text-left px-4 py-3">Resource</th>
                  <th className="text-left px-4 py-3">Result</th>
                  <th className="text-left px-4 py-3">Duration</th>
                  <th className="text-left px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record: AuditRecordResponse) => {
                  const isSuccess = record.result === 'SUCCESS'
                  return (
                    <tr
                      key={record.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        {new Date(record.createdAt).toLocaleString()}
                      </td>

                      <td className="px-4 py-3 font-medium whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-muted font-mono text-[11px]">
                          {record.actor}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-semibold whitespace-nowrap">
                        {record.action}
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] whitespace-nowrap text-muted-foreground">
                        {record.resourceType}
                        {record.resourceId ? ` / ${record.resourceId}` : ''}
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            isSuccess
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                          }`}
                        >
                          {isSuccess ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {record.result}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        {record.durationMs}ms
                      </td>

                      <td className="px-4 py-3 text-muted-foreground max-w-xs truncate" title={record.details}>
                        {record.details || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
