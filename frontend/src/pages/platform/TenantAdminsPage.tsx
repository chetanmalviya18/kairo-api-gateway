import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  getTenantAdmin,
  createTenantAdmin,
  updateTenantAdmin,
  deleteTenantAdmin,
  type TenantAdminRequest,
} from '@/features/organizations/organizationApi'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'

export default function TenantAdminsPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const id = Number(orgId)

  const [showForm, setShowForm] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [form, setForm] = useState<TenantAdminRequest>({ username: '', password: '', enabled: true })

  const { data: admin, isLoading, error } = useQuery({
    queryKey: ['tenant-admin', id],
    queryFn: () => getTenantAdmin(id),
  })

  const createMutation = useMutation({
    mutationFn: (data: TenantAdminRequest) => createTenantAdmin(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-admin', id] })
      setShowForm(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: TenantAdminRequest) => updateTenantAdmin(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-admin', id] })
      setShowForm(false)
      setIsEdit(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteTenantAdmin(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant-admin', id] }),
  })

  const openCreate = () => {
    setIsEdit(false)
    setForm({ username: '', password: '', enabled: true })
    setShowForm(true)
  }

  const openEdit = () => {
    if (!admin) return
    setIsEdit(true)
    setForm({ username: admin.username, password: '', enabled: admin.enabled })
    setShowForm(true)
  }

  const handleSubmit = () => {
    if (isEdit) updateMutation.mutate(form)
    else createMutation.mutate(form)
  }

  const noAdmin = error && (error as { response?: { status: number } }).response?.status === 404

  return (
    <div>
      <button
        onClick={() => navigate('/platform/organizations')}
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-6 transition"
      >
        <ArrowLeft size={14} /> Back to Organizations
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Tenant Admin</h2>
          <p className="text-muted-foreground text-sm mt-1">Organization #{orgId}</p>
        </div>
        {(noAdmin || !admin) && !isLoading && (
          <button
            onClick={openCreate}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition"
          >
            Assign Admin
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6 shadow-sm">
          <h3 className="font-semibold mb-4">{isEdit ? 'Edit Admin' : 'Create Admin'}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Password {isEdit && <span className="text-muted-foreground">(leave blank to keep)</span>}
              </label>
              <input
                type="password"
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 mt-4 text-sm">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
            />
            Enabled
          </label>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="border border-border px-4 py-2 rounded-md text-sm font-medium hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Admin card */}
      {isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
      {admin && (
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm flex items-center justify-between">
          <div className="space-y-1 text-sm">
            <p className="font-medium text-base">{admin.username}</p>
            <p className="text-muted-foreground">
              Status:{' '}
              <span className={admin.enabled ? 'text-green-600' : 'text-destructive'}>
                {admin.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </p>
            <p className="text-muted-foreground">
              Created: {new Date(admin.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={openEdit}
              className="text-muted-foreground hover:text-foreground transition"
              title="Edit"
            >
              <Pencil size={16} />
            </button>
            <button
              onClick={() => deleteMutation.mutate()}
              className="text-muted-foreground hover:text-destructive transition"
              title="Remove"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
      {noAdmin && !showForm && (
        <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground text-sm shadow-sm">
          No tenant admin assigned to this organization.
        </div>
      )}
    </div>
  )
}

