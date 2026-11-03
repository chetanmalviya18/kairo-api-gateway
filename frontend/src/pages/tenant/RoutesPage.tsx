import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getRoutes, changeRouteStatus, type ApiRoute } from '@/features/routes/routeApi'
import { Plus, Settings2, ToggleLeft, ToggleRight } from 'lucide-react'

export default function RoutesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: routes, isLoading } = useQuery({
    queryKey: ['routes'],
    queryFn: getRoutes,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      changeRouteStatus(id, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['routes'] }),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">API Routes</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage your gateway routes</p>
        </div>
        <button
          onClick={() => navigate('/tenant/routes/new')}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition"
        >
          <Plus size={16} /> New Route
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-muted-foreground text-sm">Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Route ID</th>
                <th className="text-left px-4 py-3 font-medium">Path Pattern</th>
                <th className="text-left px-4 py-3 font-medium">Target</th>
                <th className="text-left px-4 py-3 font-medium">Methods</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {routes?.map((route: ApiRoute) => (
                <tr key={route.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{route.routeId}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {route.pathPattern}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-[180px]">
                    {route.targetBaseUrl}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {route.allowedMethods.map((m) => (
                        <span
                          key={m}
                          className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        route.active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {route.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() =>
                          navigate(`/tenant/routes/${route.id}/header-rules`)
                        }
                        title="Header Rules"
                        className="text-muted-foreground hover:text-foreground transition"
                      >
                        <Settings2 size={16} />
                      </button>
                      <button
                        onClick={() =>
                          statusMutation.mutate({ id: route.id, active: !route.active })
                        }
                        title={route.active ? 'Deactivate' : 'Activate'}
                        className="text-muted-foreground hover:text-foreground transition"
                      >
                        {route.active ? (
                          <ToggleRight size={18} className="text-green-600" />
                        ) : (
                          <ToggleLeft size={18} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {routes?.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No routes configured yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

