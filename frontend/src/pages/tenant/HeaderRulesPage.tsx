import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { getRoute } from '@/features/routes/routeApi'
import { ArrowLeft, Settings2 } from 'lucide-react'

const DIRECTION_COLOR: Record<string, string> = {
  REQUEST: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-500/20',
  RESPONSE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-500/20',
}

const ACTION_COLOR: Record<string, string> = {
  ADD: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-500/20',
  REMOVE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-500/20',
}

export default function HeaderRulesPage() {
  const { routeId } = useParams<{ routeId: string }>()
  const navigate = useNavigate()

  const { data: route, isLoading } = useQuery({
    queryKey: ['route', routeId],
    queryFn: () => getRoute(Number(routeId)),
    enabled: !!routeId,
  })

  return (
    <div className="space-y-6 max-w-4xl">
      <button
        onClick={() => navigate('/tenant/routes')}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm font-medium transition"
      >
        <ArrowLeft size={16} /> Back to Routes
      </button>

      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Settings2 size={20} className="text-primary" />
          <span>Header Transformation Rules</span>
        </h1>
        {route && (
          <p className="text-muted-foreground text-sm mt-0.5">
            Route: <span className="font-semibold text-foreground">{route.name}</span> (
            <span className="font-mono text-xs">{route.routeId}</span>) • Path Pattern:{' '}
            <span className="font-mono text-xs font-semibold">{route.pathPattern}</span>
          </p>
        )}
      </div>

      {isLoading && (
        <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
          Loading header rules…
        </div>
      )}

      {route && (
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-muted-foreground font-semibold">
                <th className="text-left px-4 py-3">Direction</th>
                <th className="text-left px-4 py-3">Action</th>
                <th className="text-left px-4 py-3">Header Name</th>
                <th className="text-left px-4 py-3">Header Value</th>
              </tr>
            </thead>
            <tbody>
              {route.headerRules.map((rule, idx) => {
                const headerName = rule.headerName || rule.header_name || ''
                const headerValue = rule.headerValue || rule.header_value || ''
                return (
                  <tr
                    key={rule.id ?? idx}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          DIRECTION_COLOR[rule.direction] || 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {rule.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          ACTION_COLOR[rule.action] || 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {rule.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-medium">{headerName}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {headerValue || '—'}
                    </td>
                  </tr>
                )
              })}
              {route.headerRules.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No header transformation rules configured for this route.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
