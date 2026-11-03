import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  getOrganizations,
  createOrganization,
  changeOrganizationStatus,
  deleteOrganization,
  type Organization,
  type OrganizationRequest,
} from '@/features/organizations/organizationApi'
import { Plus, Users, Trash2, ToggleLeft, ToggleRight, Pencil, Building2 } from 'lucide-react'

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string }
> = {
  ACTIVE: {
    label: 'ACTIVE',
    badgeClass: 'bg-kairo-green/10 text-kairo-green border-kairo-green/20',
  },
  PENDING: {
    label: 'PENDING',
    badgeClass: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  },
  SUSPENDED: {
    label: 'SUSPENDED',
    badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
  },
  DELETED: {
    label: 'DELETED',
    badgeClass: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
  },
}

export default function OrganizationsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<OrganizationRequest>({ name: '', slug: '' })
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { data: orgs, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: getOrganizations,
  })

  const createMutation = useMutation({
    mutationFn: createOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      setShowForm(false)
      setForm({ name: '', slug: '' })
      setErrorMsg(null)
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to create organization')
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
    setErrorMsg(null)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    if (!slugRegex.test(form.slug)) {
      setErrorMsg('Slug must contain only lowercase letters, numbers, and single hyphens.')
      return
    }
    createMutation.mutate(form)
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-kairo-navy flex items-center gap-2.5">
            <Building2 className="text-kairo-green" size={26} />
            <span>Organizations</span>
          </h1>
          <p className="text-muted-foreground text-xs mt-1">
            Manage tenant workspaces, custom domain slugs, and administrator assignments
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true)
            setErrorMsg(null)
          }}
          className="flex items-center gap-2 bg-kairo-navy hover:bg-kairo-navy-light text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-sm transition self-start sm:self-auto"
        >
          <Plus size={16} /> New Organization
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreateSubmit}
          className="bg-white border border-kairo-cream-border rounded-xl p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-kairo-cream-border">
            <h3 className="font-bold text-sm text-kairo-navy">Create New Organization</h3>
            <span className="text-[11px] text-muted-foreground">Tenant Workspace</span>
          </div>

          {errorMsg && (
            <p className="text-destructive text-xs bg-destructive/10 p-3 rounded-lg border border-destructive/20">
              {errorMsg}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Organization Name <span className="text-destructive">*</span>
              </label>
              <input
                className="w-full border border-kairo-cream-border rounded-lg px-3.5 py-2 text-sm bg-kairo-cream/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-kairo-green transition"
                value={form.name}
                maxLength={150}
                placeholder="e.g. Acme Corporation"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                Slug <span className="text-destructive">*</span>
              </label>
              <input
                className="w-full border border-kairo-cream-border rounded-lg px-3.5 py-2 text-sm font-mono bg-kairo-cream/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-kairo-green transition"
                value={form.slug}
                maxLength={100}
                placeholder="e.g. acme-corp"
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
                required
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Used in gateway route prefix: <span className="font-mono">/{form.slug || '...'}/</span>
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-kairo-green hover:bg-kairo-green-light text-white px-4 py-2 rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating…' : 'Create Organization'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setErrorMsg(null)
              }}
              className="border border-kairo-cream-border px-4 py-2 rounded-lg text-xs font-medium hover:bg-kairo-cream transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-white border border-kairo-cream-border rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-xs text-muted-foreground animate-pulse">
            Loading tenant organizations…
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-kairo-cream-border bg-kairo-cream/60 text-kairo-navy font-semibold">
                <th className="text-left px-5 py-3.5">Organization</th>
                <th className="text-left px-5 py-3.5">Route Namespace</th>
                <th className="text-left px-5 py-3.5">Status</th>
                <th className="text-left px-5 py-3.5">Created</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orgs?.map((org) => {
                const statusMeta = STATUS_CONFIG[org.status] || STATUS_CONFIG.PENDING
                return (
                  <tr
                    key={org.id}
                    className="border-b border-kairo-cream-border last:border-0 hover:bg-kairo-cream/30 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => navigate(`/platform/organizations/${org.id}`)}
                        className="font-bold text-left hover:underline text-kairo-navy focus:outline-none flex items-center gap-2 group"
                        title="Click to view & edit organization"
                      >
                        <span className="text-sm">{org.name}</span>
                        <Pencil
                          size={12}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-kairo-green"
                        />
                      </button>
                    </td>

                    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                      <span className="px-2 py-0.5 rounded bg-kairo-cream font-semibold border border-kairo-cream-border">
                        /{org.slug}
                      </span>
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusMeta.badgeClass}`}
                      >
                        {statusMeta.label}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-muted-foreground">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => navigate(`/platform/organizations/${org.id}`)}
                          title="Edit organization"
                          className="text-muted-foreground hover:text-kairo-navy p-1.5 rounded hover:bg-kairo-cream transition"
                        >
                          <Pencil size={15} />
                        </button>

                        <button
                          onClick={() => navigate(`/platform/organizations/${org.id}/admin`)}
                          title="Manage tenant admin"
                          className="text-muted-foreground hover:text-kairo-navy p-1.5 rounded hover:bg-kairo-cream transition"
                        >
                          <Users size={15} />
                        </button>

                        <button
                          onClick={() => toggleStatus(org)}
                          title={org.status === 'ACTIVE' ? 'Suspend organization' : 'Activate organization'}
                          className="text-muted-foreground hover:text-kairo-navy p-1.5 rounded hover:bg-kairo-cream transition"
                        >
                          {org.status === 'ACTIVE' ? (
                            <ToggleRight size={18} className="text-kairo-green" />
                          ) : (
                            <ToggleLeft size={18} />
                          )}
                        </button>

                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                `Are you sure you want to soft-delete organization "${org.name}"?`
                              )
                            ) {
                              deleteMutation.mutate(org.id)
                            }
                          }}
                          title="Delete organization"
                          className="text-muted-foreground hover:text-destructive p-1.5 rounded hover:bg-destructive/10 transition"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}

              {orgs?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">
                    No tenant organizations registered yet.
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
