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
import { ArrowLeft, Pencil, Trash2, ToggleLeft, ToggleRight, UserCheck, UserX, KeyRound } from 'lucide-react'

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
        className="flex items-center gap-1.5 text-muted-foreground hover:text-kairo-navy text-xs font-semibold transition"
      >
        <ArrowLeft size={16} /> Back to Organization Details
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-kairo-navy flex items-center gap-2">
            <KeyRound className="text-kairo-green" size={24} />
            <span>Tenant Administrator</span>
          </h1>
          <p className="text-muted-foreground text-xs mt-0.5">Organization #{orgId}</p>
        </div>
        {(noAdmin || !admin) && !isLoading && (
          <button
            onClick={openCreate}
            className="bg-kairo-navy hover:bg-kairo-navy-light text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-sm transition"
          >
            Assign Tenant Admin
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-kairo-cream-border rounded-xl p-6 shadow-sm space-y-4"
        >
          <h3 className="font-bold text-sm text-kairo-navy">
            {isEdit ? 'Edit Tenant Admin' : 'Assign New Tenant Admin'}
          </h3>

          {errorMsg && (
            <p className="text-destructive text-xs bg-destructive/10 p-3 rounded-lg border border-destructive/20">
              {errorMsg}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Username <span className="text-destructive">*</span>
              </label>
              <input
                className="w-full border border-kairo-cream-border rounded-lg px-3.5 py-2 text-sm bg-kairo-cream/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-kairo-green transition"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Password {isEdit ? <span className="text-muted-foreground text-[10px] lowercase">(leave blank to keep)</span> : <span className="text-destructive">*</span>}
              </label>
              <input
                type="password"
                className="w-full border border-kairo-cream-border rounded-lg px-3.5 py-2 text-sm bg-kairo-cream/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-kairo-green transition"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={!isEdit}
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
              className="rounded border-kairo-cream-border text-kairo-green focus:ring-kairo-green"
            />
            <span>Active / Enabled Account</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="bg-kairo-navy hover:bg-kairo-navy-light text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving…' : 'Save Administrator'}
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

      {/* Admin details card */}
      {isLoading && (
        <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">
          Loading admin details…
        </div>
      )}

      {admin && (
        <div className="bg-white border border-kairo-cream-border rounded-xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-base text-kairo-navy">{admin.username}</span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  admin.enabled
                    ? 'bg-kairo-green/10 text-kairo-green border-kairo-green/20'
                    : 'bg-rose-500/10 text-rose-700 border-rose-500/20'
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

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => statusMutation.mutate(!admin.enabled)}
              disabled={statusMutation.isPending}
              title={admin.enabled ? 'Click to disable tenant admin' : 'Click to enable tenant admin'}
              className="flex items-center gap-1.5 text-xs font-semibold border border-kairo-cream-border hover:bg-kairo-cream px-3 py-1.5 rounded-lg transition"
            >
              {admin.enabled ? (
                <>
                  <ToggleRight size={18} className="text-kairo-green" />
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
              className="text-muted-foreground hover:text-kairo-navy p-1.5 rounded-lg hover:bg-kairo-cream transition"
              title="Edit details / password"
            >
              <Pencil size={15} />
            </button>

            <button
              onClick={() => {
                if (window.confirm(`Delete tenant admin "${admin.username}"?`)) {
                  deleteMutation.mutate()
                }
              }}
              disabled={deleteMutation.isPending}
              className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg hover:bg-destructive/10 transition"
              title="Delete tenant admin"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      )}

      {noAdmin && !showForm && (
        <div className="bg-white border border-kairo-cream-border rounded-xl p-8 text-center text-muted-foreground text-xs shadow-sm">
          No tenant administrator assigned yet. Click "Assign Tenant Admin" above to create one.
        </div>
      )}
    </div>
  )
}
