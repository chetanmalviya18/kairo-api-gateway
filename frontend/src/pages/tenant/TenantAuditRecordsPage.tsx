import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getAuditRecords } from '@/features/routes/routeApi'

export default function TenantAuditRecordsPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const {
    data: records = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ['tenant-audit-records'],
    queryFn: getAuditRecords,
  })

  const filtered = records.filter((r) => {
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
    <section className="page-section">
      {/* Section Heading */}
      <div className="section-heading">
        <div>
          <p className="eyebrow">OPERATOR HISTORY</p>
          <h1>Audit records</h1>
          <p className="muted">A chronological record of control-plane changes.</p>
        </div>
        <button
          id="refreshAuditButton"
          className="button button-quiet"
          type="button"
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
        >
          {isRefetching ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Table Card */}
      <div className="table-card">
        <div className="table-toolbar">
          <label className="search-field">
            <span aria-hidden="true">⌕</span>
            <input
              placeholder="Search action, actor or correlation ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Resource</th>
                <th>Actor</th>
                <th>Result</th>
                <th>Correlation ID</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-muted">
                    Loading audit records…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <div className="empty-state">
                      <strong>No audit records</strong>
                      <span>Changes made from this panel will appear here.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <span className="font-mono text-xs font-semibold text-forest-2">
                        {record.action}
                      </span>
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <strong className="text-xs text-ink">{record.resourceType}</strong>
                        {record.resourceId && (
                          <span className="text-[11px] font-mono text-muted">
                            #{record.resourceId}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-ink">{record.actor}</span>
                    </td>
                    <td>
                      <span
                        className={
                          record.result === 'SUCCESS'
                            ? 'status status-active'
                            : 'status status-suspended'
                        }
                      >
                        {record.result}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-[11px] text-muted">
                        {record.correlationId || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-muted">
                        {new Date(record.createdAt).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
