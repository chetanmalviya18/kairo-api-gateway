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
import { parseApiError, type ParsedApiError } from '@/lib/errorHandler'
import FormErrorBanner from '@/components/common/FormErrorBanner'
import {
  ToggleLeft,
  ToggleRight,
  Pencil,
  Trash2,
  History,
  Sliders,
} from 'lucide-react'

export default function RoutesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [searchTerm, setSearchTerm] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingRoute, setEditingRoute] = useState<ApiRoute | null>(null)
  const [versionModalRoute, setVersionModalRoute] = useState<{ id: string; name: string } | null>(null)
  const [actionError, setActionError] = useState<ParsedApiError | null>(null)

  const { data: organization } = useQuery({
    queryKey: ['tenant-organization'],
    queryFn: getTenantOrganization,
  })

  const { data: routes = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['routes'],
    queryFn: getRoutes,
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      changeRouteStatus(id, { active }),
    onSuccess: () => {
      setActionError(null)
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      queryClient.invalidateQueries({ queryKey: ['tenant-audit-records'] })
    },
    onError: (err: any) => {
      setActionError(parseApiError(err, 'Failed to toggle route status'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteRoute(id),
    onSuccess: () => {
      setActionError(null)
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      queryClient.invalidateQueries({ queryKey: ['tenant-audit-records'] })
    },
    onError: (err: any) => {
      setActionError(parseApiError(err, 'Failed to delete route'))
    },
  })

  const handleOpenCreate = () => {
    setActionError(null)
    setEditingRoute(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (route: ApiRoute) => {
    setActionError(null)
    setEditingRoute(route)
    setIsFormOpen(true)
  }

  const handleDelete = (route: ApiRoute) => {
    setActionError(null)
    if (window.confirm(`Are you sure you want to delete route "${route.routeId}" (${route.name})?`)) {
      deleteMutation.mutate(route.id)
    }
  }

  const filteredRoutes = routes.filter((r) => {
    const q = searchTerm.toLowerCase()
    return (
      r.routeId.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      r.pathPattern.toLowerCase().includes(q) ||
      r.targetBaseUrl.toLowerCase().includes(q)
    )
  })

  return (
    <section className="page-section">
      {/* Section Heading */}
      <div className="section-heading">
        <div>
          <p className="eyebrow">GATEWAY CONFIGURATION</p>
          <h1>Routes</h1>
          <p className="muted">Routing, traffic controls and transformations for your organization.</p>
        </div>
        <button
          className="button button-primary"
          type="button"
          onClick={handleOpenCreate}
        >
          + New route
        </button>
      </div>

      <FormErrorBanner error={actionError} className="mb-4" />

      {/* Table Card */}
      <div className="table-card">
        <div className="table-toolbar">
          <label className="search-field">
            <span aria-hidden="true">⌕</span>
            <input
              placeholder="Search route ID, name or path"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </label>
          <button
            className="button button-quiet"
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            {isRefetching ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Route</th>
                <th>Public path</th>
                <th>Policies</th>
                <th>Status</th>
                <th>Version</th>
                <th className="align-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-muted">
                    Loading gateway routes…
                  </td>
                </tr>
              ) : filteredRoutes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <div className="empty-state">
                      <strong>No routes configured</strong>
                      <span>Create the first route for this tenant.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRoutes.map((route) => (
                  <tr key={route.id}>
                    <td>
                      <div className="flex flex-col">
                        <strong className="font-semibold text-ink text-sm">{route.name}</strong>
                        <span className="font-mono text-[11px] text-muted">{route.routeId}</span>
                      </div>
                    </td>

                    <td>
                      <code className="path-code font-mono text-xs text-forest-2">
                        {route.pathPattern}
                      </code>
                    </td>

                    <td>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[10px] bg-paper px-1.5 py-0.5 rounded border border-line text-ink">
                          {route.allowedMethods.join(', ')}
                        </span>
                        {route.requestsPerMinute && (
                          <span className="font-mono text-[10px] bg-paper px-1.5 py-0.5 rounded border border-line text-muted">
                            {route.requestsPerMinute} req/m
                          </span>
                        )}
                        {route.idempotencyEnabled && (
                          <span className="font-mono text-[10px] bg-paper px-1.5 py-0.5 rounded border border-line text-forest-2 font-medium">
                            idempotent
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <span className={route.active ? 'status status-active' : 'status status-inactive'}>
                        {route.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>

                    <td>
                      <span className="font-mono text-xs text-muted">
                        v{route.configurationVersion}
                      </span>
                    </td>

                    <td className="align-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(route)}
                          className="button button-quiet p-1.5 h-auto min-h-0 text-xs"
                          title="Edit Route"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/tenant/routes/${route.id}/headers`)}
                          className="button button-quiet p-1.5 h-auto min-h-0 text-xs"
                          title="Header Rules"
                        >
                          <Sliders size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setVersionModalRoute({ id: route.routeId, name: route.name })}
                          className="button button-quiet p-1.5 h-auto min-h-0 text-xs"
                          title="Route Version History"
                        >
                          <History size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => statusMutation.mutate({ id: route.id, active: !route.active })}
                          disabled={statusMutation.isPending}
                          className="button button-quiet p-1.5 h-auto min-h-0 text-xs"
                          title={`Toggle ${route.active ? 'Inactive' : 'Active'}`}
                        >
                          {route.active ? (
                            <ToggleRight size={15} className="text-forest-2" />
                          ) : (
                            <ToggleLeft size={15} className="text-muted" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(route)}
                          disabled={deleteMutation.isPending}
                          className="button button-danger p-1.5 h-auto min-h-0 text-xs"
                          title="Delete Route"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Route Form Modal */}
      {isFormOpen && (
        <RouteFormModal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          initialData={editingRoute}
          organizationSlug={organization?.slug}
        />
      )}

      {/* Route Versions Timeline Modal */}
      {versionModalRoute && (
        <RouteVersionsModal
          isOpen={Boolean(versionModalRoute)}
          onClose={() => setVersionModalRoute(null)}
          routeId={versionModalRoute.id}
          routeName={versionModalRoute.name}
        />
      )}
    </section>
  )
}
