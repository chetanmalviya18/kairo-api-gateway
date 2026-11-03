import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { getRoute } from '@/features/routes/routeApi'
import { ArrowLeft, Settings2 } from 'lucide-react'

const DIRECTION_COLOR: Record<string, string> = {
  REQUEST: 'bg-kairo-navy/10 text-kairo-navy border-kairo-navy/20',
  RESPONSE: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20',
}

const ACTION_COLOR: Record<string, string> = {
  ADD: 'bg-kairo-green/10 text-kairo-green border-kairo-green/20',
  REMOVE: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
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
        className="flex items-center gap-1.5 text-muted-foreground hover:text-kairo-navy text-xs font-semibold transition"
      >
        <ArrowLeft size={16} /> Back to Routes
      </button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-kairo-navy flex items-center gap-2.5">
          <Settings2 size={24} className="text-kairo-green" />
          <span>Header Transformation Rules</span>
        </h1>
        {route && (
          <p className="text-muted-foreground text-xs mt-1">
            Route: <span className="font-bold text-kairo-navy">{route.name}</span> (
            <span className="font-mono text-xs">{route.routeId}</span>) • Path Pattern:{' '}
            <span className="font-mono text-xs font-semibold text-kairo-navy">{route.pathPattern}</span>
          </p>
        )}
      </div>

      {isLoading && (
        <div className="p-10 text-center text-xs text-muted-foreground animate-pulse">
          Loading header transformation rules…
        </div>
      )}

      {route && (
        <div className="bg-white border border-kairo-cream-border rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-kairo-cream-border bg-kairo-cream/60 text-kairo-navy font-semibold">
                <th className="text-left px-5 py-3.5">Direction</th>
                <th className="text-left px-5 py-3.5">Action</th>
                <th className="text-left px-5 py-3.5">Header Name</th>
                <th className="text-left px-5 py-3.5">Header Value</th>
              </tr>
            </thead>
            <tbody>
              {route.headerRules.map((rule, idx) => {
                const headerName = rule.headerName || rule.header_name || ''
                const headerValue = rule.headerValue || rule.header_value || ''
                return (
                  <tr
                    key={rule.id ?? idx}
                    className="border-b border-kairo-cream-border last:border-0 hover:bg-kairo-cream/30 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          DIRECTION_COLOR[rule.direction] || 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {rule.direction}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          ACTION_COLOR[rule.action] || 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {rule.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-kairo-navy">{headerName}</td>
                    <td className="px-5 py-3.5 font-mono text-muted-foreground">
                      {headerValue || '—'}
                    </td>
                  </tr>
                )
              })}
              {route.headerRules.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">
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
