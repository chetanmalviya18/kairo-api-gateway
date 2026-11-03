import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { getRoute } from '@/features/routes/routeApi'
import { ArrowLeft } from 'lucide-react'

export default function HeaderRulesPage() {
  const { routeId } = useParams<{ routeId: string }>()
  const navigate = useNavigate()

  const { data: route, isLoading } = useQuery({
    queryKey: ['route', routeId],
    queryFn: () => getRoute(Number(routeId)),
    enabled: !!routeId,
  })

  return (
    <section className="page-section">
      <button
        onClick={() => navigate('/tenant/routes')}
        className="button button-quiet mb-6 inline-flex items-center gap-2 text-xs"
        type="button"
      >
        <ArrowLeft size={14} /> Back to Routes
      </button>

      {/* Section Heading */}
      <div className="section-heading">
        <div>
          <p className="eyebrow">GATEWAY CONFIGURATION</p>
          <h1>Header transformation rules</h1>
          {route ? (
            <p className="muted">
              Rules configured for <strong className="text-ink">{route.name}</strong> ({route.routeId}) on path{' '}
              <code className="text-forest-2 font-mono">{route.pathPattern}</code>
            </p>
          ) : (
            <p className="muted">Configure request and response headers for downstream services.</p>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted text-xs animate-pulse">
          Loading header transformation rules…
        </div>
      ) : !route ? (
        <div className="table-card p-0">
          <div className="empty-state">
            <strong>Route not found</strong>
            <span>Unable to load rules for route #{routeId}.</span>
          </div>
        </div>
      ) : (
        <div className="table-card">
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Direction</th>
                  <th>Action</th>
                  <th>Header Name</th>
                  <th>Header Value</th>
                </tr>
              </thead>
              <tbody>
                {route.headerRules.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-0">
                      <div className="empty-state">
                        <strong>No header rules configured</strong>
                        <span>This route forwards headers without modifications.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  route.headerRules.map((rule, idx) => {
                    const headerName = rule.headerName || rule.header_name || ''
                    const headerValue = rule.headerValue || rule.header_value || ''
                    return (
                      <tr key={rule.id ?? idx}>
                        <td>
                          <span
                            className={
                              rule.direction === 'REQUEST'
                                ? 'status status-active'
                                : 'status status-pending'
                            }
                          >
                            {rule.direction}
                          </span>
                        </td>
                        <td>
                          <span
                            className={
                              rule.action === 'ADD'
                                ? 'status status-active'
                                : 'status status-suspended'
                            }
                          >
                            {rule.action}
                          </span>
                        </td>
                        <td>
                          <code className="font-mono text-xs font-semibold text-ink">
                            {headerName}
                          </code>
                        </td>
                        <td>
                          <span className="font-mono text-xs text-muted">
                            {headerValue || '—'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
