import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { getRoute } from '@/features/routes/routeApi'
import { ArrowLeft } from 'lucide-react'

const DIRECTION_COLOR: Record<string, string> = {
  REQUEST: 'bg-blue-100 text-blue-700',
  RESPONSE: 'bg-purple-100 text-purple-700',
}

const ACTION_COLOR: Record<string, string> = {
  ADD: 'bg-green-100 text-green-700',
  REMOVE: 'bg-red-100 text-red-700',
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
    <div>
      <button
        onClick={() => navigate('/tenant/routes')}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-6 transition"
      >
        <ArrowLeft size={14} /> Back to Routes
      </button>

      <div className="mb-6">
        <h2 className="text-xl font-bold">Header Rules</h2>
        {route && (
          <p className="text-muted-foreground text-sm mt-1">
            Route: <span className="font-mono">{route.routeId}</span> — {route.pathPattern}
          </p>
        )}
      </div>

      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}

      {route && (
        <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Direction</th>
                <th className="text-left px-4 py-3 font-medium">Action</th>
                <th className="text-left px-4 py-3 font-medium">Header Name</th>
                <th className="text-left px-4 py-3 font-medium">Header Value</th>
              </tr>
            </thead>
            <tbody>
              {route.headerRules.map((rule) => (
                <tr
                  key={rule.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${DIRECTION_COLOR[rule.direction]}`}
                    >
                      {rule.direction}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLOR[rule.action]}`}
                    >
                      {rule.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{rule.headerName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {rule.headerValue ?? '—'}
                  </td>
                </tr>
              ))}
              {route.headerRules.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No header rules configured for this route.
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

