import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  getOrganizations,
  createOrganization,
  changeOrganizationStatus,
  deleteOrganization,
  type Organization,
  type OrganizationRequest,
} from '@/features/organizations/organizationApi'
import { Users, Trash2, ToggleLeft, ToggleRight, Pencil, RefreshCw, X } from 'lucide-react'
import { parseApiError, type ParsedApiError } from '@/lib/errorHandler'
import FormErrorBanner from '@/components/common/FormErrorBanner'

export default function OrganizationsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [form, setForm] = useState<OrganizationRequest>({ name: '', slug: '' })
  const [apiError, setApiError] = useState<ParsedApiError | null>(null)

  const { data: orgs = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['organizations'],
    queryFn: getOrganizations,
  })

  const createMutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      setShowForm(false)
      setForm({ name: '', slug: '' })
      setApiError(null)
    },
    onError: (err: any) => {
      setApiError(parseApiError(err, 'Failed to create organization'))
    },
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: Organization['status'] }) =>
      changeOrganizationStatus(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organizations'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteOrganization,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['organizations'] }),
  })

  const toggleStatus = (org: Organization) => {
    const next = org.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    statusMutation.mutate({ id: org.id, status: next })
  }

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    if (!slugRegex.test(form.slug)) {
      setApiError({
        status: 400,
        message: 'Validation Failed',
        fieldErrors: { slug: 'Must contain only lowercase letters, numbers, and single hyphens.' },
        formattedMessage: 'Validation Failed (slug: Must contain only lowercase letters, numbers, and single hyphens.)',
      })
      return
    }
    createMutation.mutate(form)
  }

  const filteredOrgs = useMemo(() => {
    if (!search.trim()) return orgs
    const q = search.toLowerCase()
    return orgs.filter(
      (o) => o.name.toLowerCase().includes(q) || o.slug.toLowerCase().includes(q)
    )
  }, [orgs, search])

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'status status-active'
      case 'PENDING':
        return 'status status-pending'
      case 'SUSPENDED':
      case 'DELETED':
        return 'status status-suspended'
      default:
        return 'status status-inactive'
    }
  }

  return (
    <section className="page-section">
      {/* Section Heading */}
      <div className="section-heading">
        <div>
          <p className="eyebrow">TENANT DIRECTORY</p>
          <h1>Organizations</h1>
          <p className="muted">Provision tenants, control status and manage their administrator.</p>
        </div>
        <button
          className="button button-primary"
          type="button"
          onClick={() => {
            setShowForm(true)
            setApiError(null)
          }}
        >
          + New organization
        </button>
      </div>

      {/* Table Card */}
      <div className="table-card">
        <div className="table-toolbar">
          <label className="search-field">
            <span aria-hidden="true">⌕</span>
            <input
              placeholder="Search name or slug"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <button
            className="button button-quiet"
            type="button"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw size={13} className={isRefetching ? 'animate-spin' : ''} />
            <span>{isRefetching ? 'Refreshing…' : 'Refresh'}</span>
          </button>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Organization</th>
                <th>Slug</th>
                <th>Status</th>
                <th>Created</th>
                <th className="align-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-muted">
                    Loading organizations…
                  </td>
                </tr>
              ) : filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-0">
                    <div className="empty-state">
                      <strong>No organizations yet</strong>
                      <span>Create FoodFast or QuickShop to begin.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => (
                  <tr key={org.id}>
                    <td>
                      <div className="flex flex-col">
                        <strong
                          onClick={() => navigate(`/platform/organizations/${org.id}`)}
                          className="cursor-pointer hover:underline text-ink font-semibold"
                        >
                          {org.name}
                        </strong>
                        <span className="text-[11px] text-muted font-mono">ID: {org.id}</span>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-forest-2">/{org.slug}</span>
                    </td>
                    <td>
                      <span className={getStatusClass(org.status)}>{org.status}</span>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-muted">
                        {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td className="align-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/platform/organizations/${org.id}`)}
                          className="button button-quiet p-1.5 h-auto min-h-0 text-xs"
                          title="Edit organization"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/platform/organizations/${org.id}/admins`)}
                          className="button button-quiet p-1.5 h-auto min-h-0 text-xs"
                          title="Manage tenant admins"
                        >
                          <Users size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(org)}
                          disabled={statusMutation.isPending}
                          className="button button-quiet p-1.5 h-auto min-h-0 text-xs"
                          title={`Set ${org.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'}`}
                        >
                          {org.status === 'ACTIVE' ? (
                            <ToggleRight size={15} className="text-forest-2" />
                          ) : (
                            <ToggleLeft size={15} className="text-muted" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete organization "${org.name}"?`)) {
                              deleteMutation.mutate(org.id)
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="button button-danger p-1.5 h-auto min-h-0 text-xs"
                          title="Delete organization"
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

      {/* New Organization Dialog Modal via Portal to avoid stacking context traps */}
      {showForm &&
        createPortal(
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-header">
                  <div>
                    <p className="eyebrow">PLATFORM OPERATION</p>
                    <h2>New organization</h2>
                  </div>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => setShowForm(false)}
                    aria-label="Close"
                  >
                    <X size={18} />
                  </button>
                </div>

                <FormErrorBanner error={apiError} />

                <div className="form-grid">
                  <label className={`field form-span ${apiError?.fieldErrors?.name ? 'field-has-error' : ''}`}>
                    <span>Name</span>
                    <input
                      id="organizationName"
                      maxLength={150}
                      placeholder="FoodFast"
                      value={form.name}
                      onChange={(e) => {
                        setForm({ ...form, name: e.target.value })
                        if (apiError?.fieldErrors?.name) {
                          const updated = { ...apiError.fieldErrors }
                          delete updated.name
                          setApiError({ ...apiError, fieldErrors: updated })
                        }
                      }}
                      required
                      autoFocus
                    />
                    {apiError?.fieldErrors?.name && (
                      <span className="field-error-msg">{apiError.fieldErrors.name}</span>
                    )}
                  </label>

                  <label className={`field form-span ${apiError?.fieldErrors?.slug ? 'field-has-error' : ''}`}>
                    <span>Slug</span>
                    <input
                      id="organizationSlug"
                      maxLength={100}
                      pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                      placeholder="foodfast"
                      value={form.slug}
                      onChange={(e) => {
                        setForm({ ...form, slug: e.target.value.toLowerCase() })
                        if (apiError?.fieldErrors?.slug) {
                          const updated = { ...apiError.fieldErrors }
                          delete updated.slug
                          setApiError({ ...apiError, fieldErrors: updated })
                        }
                      }}
                      required
                    />
                    {apiError?.fieldErrors?.slug ? (
                      <span className="field-error-msg">{apiError.fieldErrors.slug}</span>
                    ) : (
                      <small>Lowercase letters, numbers and hyphens.</small>
                    )}
                  </label>
                </div>

                <div className="modal-actions">
                  <button
                    className="button button-quiet"
                    type="button"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="button button-primary"
                    type="submit"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Saving…' : 'Save organization'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </section>
  )
}
