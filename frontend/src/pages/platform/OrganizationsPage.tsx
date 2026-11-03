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
import { Plus, Users, Trash2, ToggleLeft, ToggleRight, Pencil } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  SUSPENDED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  DELETED: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
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
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Organizations</h2>
          <p className="text-muted-foreground text-sm mt-1">Manage tenant organizations</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true)
            setErrorMsg(null)
          }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition"
        >
          <Plus size={16} /> New Organization
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={handleCreateSubmit}
          className="bg-card border border-border rounded-lg p-6 mb-6 shadow-sm"
        >
          <h3 className="font-semibold mb-4">Create Organization</h3>

          {errorMsg && (
            <p className="text-destructive text-sm mb-4 bg-destructive/10 p-3 rounded-md">
              {errorMsg}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Name <span className="text-destructive">*</span>
              </label>
              <input
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.name}
                maxLength={150}
                placeholder="e.g. Acme Corp"
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Slug <span className="text-destructive">*</span>
              </label>
              <input
                className="w-full border border-input rounded-md px-3 py-2 text-sm font-mono bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.slug}
                maxLength={100}
                placeholder="e.g. acme-corp"
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
                required
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating…' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setErrorMsg(null)
              }}
              className="border border-border px-4 py-2 rounded-md text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-muted-foreground text-sm">Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Slug</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orgs?.map((org) => (
                <tr
                  key={org.id}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => navigate(`/platform/organizations/${org.id}`)}
                      className="font-medium text-left hover:underline text-primary focus:outline-none flex items-center gap-1.5"
                      title="Click to view & edit organization"
                    >
                      {org.name}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    /{org.slug}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        STATUS_COLORS[org.status] || STATUS_COLORS.PENDING
                      }`}
                    >
                      {org.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(org.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => navigate(`/platform/organizations/${org.id}`)}
                        title="Edit organization"
                        className="text-muted-foreground hover:text-foreground p-1 transition"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => navigate(`/platform/organizations/${org.id}/admin`)}
                        title="Manage tenant admin"
                        className="text-muted-foreground hover:text-foreground p-1 transition"
                      >
                        <Users size={16} />
                      </button>
                      <button
                        onClick={() => toggleStatus(org)}
                        title={org.status === 'ACTIVE' ? 'Suspend organization' : 'Activate organization'}
                        className="text-muted-foreground hover:text-foreground p-1 transition"
                      >
                        {org.status === 'ACTIVE' ? (
                          <ToggleRight size={18} className="text-green-600" />
                        ) : (
                          <ToggleLeft size={18} />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Are you sure you want to delete organization "${org.name}"?`
                            )
                          ) {
                            deleteMutation.mutate(org.id)
                          }
                        }}
                        title="Delete organization"
                        className="text-muted-foreground hover:text-destructive p-1 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {orgs?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No organizations yet.
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
