import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  getTenantAdmin,
  createTenantAdmin,
  updateTenantAdmin,
  changeTenantAdminStatus,
  deleteTenantAdmin,
  type TenantAdminRequest,
} from '@/features/organizations/organizationApi'
import { ArrowLeft, Pencil, Trash2, ToggleLeft, ToggleRight, UserCheck, UserX } from 'lucide-react'

export default function TenantAdminsPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const id = Number(orgId)

  const [showForm, setShowForm] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [form, setForm] = useState<TenantAdminRequest>({ username: '', password: '', enabled: true })
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const { data: admin, isLoading, error } = useQuery({
    queryKey: ['tenant-admin', id],
    queryFn: () => getTenantAdmin(id),
  })

  const createMutation = useMutation({
    mutationFn: (data: TenantAdminRequest) => createTenantAdmin(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-admin', id] })
      setShowForm(false)
      setErrorMsg(null)
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to create tenant admin')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: TenantAdminRequest) => updateTenantAdmin(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-admin', id] })
      setShowForm(false)
      setIsEdit(false)
      setErrorMsg(null)
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to update tenant admin')
    },
  })

  // Status toggle mutation using the new endpoint
  const statusMutation = useMutation({
    mutationFn: (enabled: boolean) =>
      changeTenantAdminStatus(id, admin!.id, { enabled }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['tenant-admin', id], updated)
      queryClient.invalidateQueries({ queryKey: ['tenant-admin', id] })
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || err.message || 'Failed to change admin status')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteTenantAdmin(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant-admin', id] }),
  })

  const openCreate = () => {
    setIsEdit(false)
    setForm({ username: '', password: '', enabled: true })
    setErrorMsg(null)
    setShowForm(true)
  }

  const openEdit = () => {
    if (!admin) return
    setIsEdit(true)
    setForm({ username: admin.username, password: '', enabled: admin.enabled })
    setErrorMsg(null)
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    if (isEdit) updateMutation.mutate(form)
    else createMutation.mutate(form)
  }

  const noAdmin = error && (error as { response?: { status: number } }).response?.status === 404

  return (
    <div className="max-w-3xl space-y-6">
      <button
        onClick={() => navigate(`/platform/organizations/${orgId}`)}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm font-medium transition"
      >
        <ArrowLeft size={16} /> Back to Organization Details
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Tenant Administrator</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Organization #{orgId}</p>
        </div>
        {(noAdmin || !admin) && !isLoading && (
          <button
            onClick={openCreate}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition shadow-sm"
          >
            Assign Tenant Admin
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-4"
        >
          <h3 className="font-semibold text-base">
            {isEdit ? 'Edit Tenant Admin' : 'Assign New Tenant Admin'}
          </h3>

          {errorMsg && (
            <p className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">
              {errorMsg}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Username <span className="text-destructive">*</span>
              </label>
              <input
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Password {isEdit ? <span className="text-muted-foreground text-xs">(leave blank to keep)</span> : <span className="text-destructive">*</span>}
              </label>
              <input
                type="password"
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!isEdit}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              className="rounded border-input text-primary focus:ring-ring"
            />
            <span className="font-medium">Active / Enabled</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setErrorMsg(null)
              }}
              className="border border-border px-4 py-2 rounded-md text-sm font-medium hover:bg-accent transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Admin details card */}
      {isLoading && (
        <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
          Loading admin details…
        </div>
      )}

      {admin && (
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="font-semibold text-lg">{admin.username}</span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  admin.enabled
                    ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                    : 'bg-red-500/10 text-red-600 border border-red-500/20'
                }`}
              >
                {admin.enabled ? <UserCheck size={12} /> : <UserX size={12} />}
                {admin.enabled ? 'Active' : 'Disabled'}
              </span>
            </div>

            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>Admin ID: #{admin.id}</p>
              <p>Created: {new Date(admin.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick status toggle button using the PATCH /status endpoint */}
            <button
              onClick={() => statusMutation.mutate(!admin.enabled)}
              disabled={statusMutation.isPending}
              title={admin.enabled ? 'Click to disable tenant admin' : 'Click to enable tenant admin'}
              className="flex items-center gap-1.5 text-xs font-medium border border-border hover:bg-accent px-3 py-1.5 rounded-md transition"
            >
              {admin.enabled ? (
                <>
                  <ToggleRight size={18} className="text-green-600" />
                  <span>Disable</span>
                </>
              ) : (
                <>
                  <ToggleLeft size={18} className="text-muted-foreground" />
                  <span>Enable</span>
                </>
              )}
            </button>

            <button
              onClick={openEdit}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded hover:bg-accent transition"
              title="Edit details / password"
            >
              <Pencil size={16} />
            </button>

            <button
              onClick={() => {
                if (window.confirm(`Delete tenant admin "${admin.username}"?`)) {
                  deleteMutation.mutate()
                }
              }}
              disabled={deleteMutation.isPending}
              className="text-muted-foreground hover:text-destructive p-1.5 rounded hover:bg-destructive/10 transition"
              title="Delete tenant admin"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}

      {noAdmin && !showForm && (
        <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground text-sm shadow-sm">
          No tenant administrator assigned yet. Click "Assign Tenant Admin" above to create one.
        </div>
      )}
    </div>
  )
}
