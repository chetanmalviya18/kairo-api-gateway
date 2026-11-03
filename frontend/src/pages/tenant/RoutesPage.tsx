import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  getRoutes,
  changeRouteStatus,
  deleteRoute,
  type ApiRoute,
} from '@/features/routes/routeApi'
import { getTenantOrganization } from '@/features/organizations/organizationApi'
import RouteFormModal from './RouteFormModal'
import RouteVersionsModal from './RouteVersionsModal'
import {
  Plus,
  Settings2,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Trash2,
  History,
  Search,
  Zap,
} from 'lucide-react'

export default function RoutesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState<ApiRoute | null>(null)
  const [versionModalRoute, setVersionModalRoute] = useState<{ id: string; name: string } | null>(null)

  // Fetch tenant organization for route slug namespace helper
  const { data: organization } = useQuery({
    queryKey: ['tenant-organization'],
    queryFn: getTenantOrganization,
  })

  // Fetch all routes
  const { data: routes, isLoading } = useQuery({
    queryKey: ['routes'],
    queryFn: getRoutes,
  })

  // Status toggle mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      changeRouteStatus(id, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      queryClient.invalidateQueries({ queryKey: ['tenant-audit-records'] })
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || err.message || 'Failed to toggle route status')
    },
  })

  // Delete route mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteRoute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      queryClient.invalidateQueries({ queryKey: ['tenant-audit-records'] })
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || err.message || 'Failed to delete route')
    },
  })

  const handleOpenCreate = () => {
    setEditingRoute(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (route: ApiRoute) => {
    setEditingRoute(route)
    setIsFormOpen(true)
  }

  const handleDelete = (route: ApiRoute) => {
    if (window.confirm(`Are you sure you want to delete route "${route.routeId}" (${route.name})?`)) {
      deleteMutation.mutate(route.id)
    }
  }

  const filteredRoutes = routes?.filter((r) => {
    const q = searchTerm.toLowerCase()
    return (
      r.routeId.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.pathPattern.toLowerCase().includes(q) ||
      r.targetBaseUrl.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">API Gateway Routes</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage URL routing patterns, targets, rate limits, and header transformations
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition shadow-sm self-start sm:self-auto"
        >
          <Plus size={16} /> New Route
        </button>
      </div>

      {/* Search / Filter Bar */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-2.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by route ID, name, or path pattern…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full border border-input rounded-md pl-9 pr-4 py-2 text-xs bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Routes Table */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
            Loading gateway routes…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-muted-foreground font-semibold">
                  <th className="text-left px-4 py-3">Route</th>
                  <th className="text-left px-4 py-3">Path Pattern</th>
                  <th className="text-left px-4 py-3">Target Upstream</th>
                  <th className="text-left px-4 py-3">Methods</th>
                  <th className="text-left px-4 py-3">Limits</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoutes?.map((route: ApiRoute) => (
                  <tr
                    key={route.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    {/* Route ID & Name */}
                    <td className="px-4 py-3">
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-foreground">
                          <span>{route.name}</span>
                          <span className="font-mono text-[10px] text-muted-foreground px-1.5 py-0.2 bg-muted rounded">
                            v{route.configurationVersion}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-muted-foreground block">
                          {route.routeId}
                        </span>
                      </div>
                    </td>

                    {/* Path Pattern */}
                    <td className="px-4 py-3 font-mono font-medium text-foreground">
                      {route.pathPattern}
                    </td>

                    {/* Target Base URL + Prefix */}
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground max-w-[200px] truncate">
                      <span title={`${route.targetBaseUrl}${route.targetPathPrefix}`}>
                        {route.targetBaseUrl}
                        {route.targetPathPrefix !== '/' ? route.targetPathPrefix : ''}
                      </span>
                    </td>

                    {/* Allowed Methods */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[140px]">
                        {route.allowedMethods.map((m) => (
                          <span
                            key={m}
                            className="px-1.5 py-0.5 bg-muted border border-border/60 rounded text-[10px] font-mono font-semibold"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Limits & Idempotency */}
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      <div>{route.requestsPerMinute} req/min</div>
                      <div className="text-[11px] flex items-center gap-1">
                        <span>{route.responseTimeoutMs}ms</span>
                        {route.idempotencyEnabled && (
                          <span
                            title="Idempotency Enabled"
                            className="text-amber-500 font-bold"
                          >
                            <Zap size={11} className="inline fill-current" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          route.active
                            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                            : 'bg-gray-500/10 text-gray-500 dark:text-gray-400 border border-gray-500/20'
                        }`}
                      >
                        {route.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center gap-1 justify-end">
                        {/* Versions */}
                        <button
                          onClick={() =>
                            setVersionModalRoute({ id: route.routeId, name: route.name })
                          }
                          title="View configuration versions"
                          className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-accent transition"
                        >
                          <History size={15} />
                        </button>

                        {/* Header Rules */}
                        <button
                          onClick={() =>
                            navigate(`/tenant/routes/${route.id}/header-rules`)
                          }
                          title={`Header Rules (${route.headerRules?.length || 0})`}
                          className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-accent transition relative"
                        >
                          <Settings2 size={15} />
                          {route.headerRules && route.headerRules.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-primary text-primary-foreground text-[9px] rounded-full flex items-center justify-center font-bold">
                              {route.headerRules.length}
                            </span>
                          )}
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(route)}
                          title="Edit Route"
                          className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-accent transition"
                        >
                          <Pencil size={15} />
                        </button>

                        {/* Status Toggle */}
                        <button
                          onClick={() =>
                            statusMutation.mutate({ id: route.id, active: !route.active })
                          }
                          title={route.active ? 'Deactivate Route' : 'Activate Route'}
                          className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-accent transition"
                        >
                          {route.active ? (
                            <ToggleRight size={18} className="text-green-600" />
                          ) : (
                            <ToggleLeft size={18} />
                          )}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(route)}
                          title="Delete Route"
                          className="text-muted-foreground hover:text-destructive p-1.5 rounded hover:bg-destructive/10 transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredRoutes?.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No matching routes found. Click "New Route" to create your first route.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Route Create / Edit Modal */}
      <RouteFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setEditingRoute(null)
        }}
        route={editingRoute}
        tenantSlug={organization?.slug}
      />

      {/* Configuration Versions Modal */}
      {versionModalRoute && (
        <RouteVersionsModal
          isOpen={!!versionModalRoute}
          onClose={() => setVersionModalRoute(null)}
          routeId={versionModalRoute.id}
          routeName={versionModalRoute.name}
        />
      )}
    </div>
  )
}
