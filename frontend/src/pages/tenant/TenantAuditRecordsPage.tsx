import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAuditRecords, type AuditRecordResponse } from '@/features/routes/routeApi'
import { ShieldCheck, Search, RefreshCw, CheckCircle2, XCircle } from 'lucide-react'

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
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-kairo-navy flex items-center gap-2.5">
            <ShieldCheck className="text-kairo-green" size={26} />
            <span>Audit Records</span>
          </h1>
          <p className="text-muted-foreground text-xs mt-1">
            Immutable audit trail of configuration modifications and administrative events
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-semibold border border-kairo-cream-border bg-white hover:bg-kairo-cream px-3.5 py-2.5 rounded-lg transition shadow-xs disabled:opacity-50 text-kairo-navy"
        >
          <RefreshCw size={14} className={isRefetching ? 'animate-spin' : ''} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-3 text-muted-foreground" />
        <input
          type="text"
          placeholder="Filter by action, actor, resource ID, or correlation ID…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-kairo-cream-border rounded-lg pl-10 pr-4 py-2.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-kairo-green shadow-xs transition"
        />
      </div>

      {/* Audit Table */}
      <div className="bg-white border border-kairo-cream-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-xs text-muted-foreground animate-pulse">
            Loading control plane audit records…
          </div>
        ) : !filtered || filtered.length === 0 ? (
          <div className="p-10 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
            <ShieldCheck size={32} className="text-muted-foreground/40" />
            <p>No audit records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-kairo-cream-border bg-kairo-cream/60 text-kairo-navy font-semibold">
                  <th className="text-left px-5 py-3.5">Timestamp</th>
                  <th className="text-left px-5 py-3.5">Actor</th>
                  <th className="text-left px-5 py-3.5">Action</th>
                  <th className="text-left px-5 py-3.5">Resource</th>
                  <th className="text-left px-5 py-3.5">Result</th>
                  <th className="text-left px-5 py-3.5">Latency</th>
                  <th className="text-left px-5 py-3.5">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record: AuditRecordResponse) => {
                  const isSuccess = record.result === 'SUCCESS'
                  return (
                    <tr
                      key={record.id}
                      className="border-b border-kairo-cream-border last:border-0 hover:bg-kairo-cream/30 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        {new Date(record.createdAt).toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5 font-medium whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-kairo-cream border border-kairo-cream-border font-mono text-[11px] text-kairo-navy">
                          {record.actor}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 font-bold text-kairo-navy whitespace-nowrap">
                        {record.action}
                      </td>

                      <td className="px-5 py-3.5 font-mono text-[11px] whitespace-nowrap text-muted-foreground">
                        {record.resourceType}
                        {record.resourceId ? ` / ${record.resourceId}` : ''}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            isSuccess
                              ? 'bg-kairo-green/10 text-kairo-green border-kairo-green/20'
                              : 'bg-rose-500/10 text-rose-700 border-rose-500/20'
                          }`}
                        >
                          {isSuccess ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {record.result}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                        {record.durationMs}ms
                      </td>

                      <td className="px-5 py-3.5 text-muted-foreground max-w-xs truncate" title={record.details}>
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
