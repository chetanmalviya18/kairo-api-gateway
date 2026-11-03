import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  getTenantAdmin,
  createTenantAdmin,
  updateTenantAdmin,
  changeTenantAdminStatus,
  deleteTenantAdmin,
  type TenantAdminRequest,
} from '@/features/organizations/organizationApi'
import { Pencil, Trash2, ToggleLeft, ToggleRight, ArrowLeft, X } from 'lucide-react'

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
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteTenantAdmin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-admin', id] })
      setShowForm(false)
    },
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

    if (!form.username.trim()) {
      setErrorMsg('Username is required.')
      return
    }

    if (!isEdit && (!form.password || form.password.length < 8)) {
      setErrorMsg('Password must be at least 8 characters.')
      return
    }

    if (isEdit) {
      updateMutation.mutate(form)
    } else {
      createMutation.mutate(form)
    }
  }

  const noAdmin =
    !admin && !isLoading && (error as any)?.response?.status === 404

  return (
    <section className="page-section">
      <button
        onClick={() => navigate('/platform/organizations')}
        className="button button-quiet mb-6 inline-flex items-center gap-2 text-xs"
        type="button"
      >
        <ArrowLeft size={14} /> Back to Organizations
      </button>

      {/* Section Heading */}
      <div className="section-heading">
        <div>
          <p className="eyebrow">TENANT ACCESS</p>
          <h1>Tenant administrator</h1>
          <p className="muted">Manage the primary administrator account for organization #{orgId}.</p>
        </div>
        {(noAdmin || !admin) && !isLoading && (
          <button
            onClick={openCreate}
            className="button button-primary"
            type="button"
          >
            + Assign administrator
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted text-xs animate-pulse">
          Loading administrator details…
        </div>
      ) : noAdmin || !admin ? (
        <div className="table-card p-0">
          <div className="empty-state">
            <strong>No administrator assigned</strong>
            <span>Assign a tenant administrator to enable portal management.</span>
          </div>
        </div>
      ) : (
        <div className="profile-card">
          <div className="flex items-center justify-between">
            <div>
              <h2>{admin.username}</h2>
              <p className="muted text-xs mt-1">Tenant Administrator Account</p>
            </div>
            <span
              className={
                admin.enabled ? 'status status-active' : 'status status-suspended'
              }
            >
              {admin.enabled ? 'ACTIVE' : 'DISABLED'}
            </span>
          </div>

          <div className="profile-details">
            <div>
              <span>ADMINISTRATOR ID</span>
              <strong className="font-mono">#{admin.id}</strong>
            </div>

            <div>
              <span>ORGANIZATION ID</span>
              <strong className="font-mono">#{orgId}</strong>
            </div>

            <div>
              <span>CREATED AT</span>
              <strong className="font-mono">
                {admin.createdAt ? new Date(admin.createdAt).toLocaleString() : '—'}
              </strong>
            </div>

            <div>
              <span>ACCOUNT STATUS</span>
              <strong className="font-mono">{admin.enabled ? 'Enabled' : 'Disabled'}</strong>
            </div>
          </div>

          <div className="modal-actions mt-6 pt-4 flex gap-2">
            <button
              onClick={openEdit}
              className="button button-quiet"
              type="button"
            >
              <Pencil size={13} /> Edit account
            </button>
            <button
              onClick={() => statusMutation.mutate(!admin.enabled)}
              disabled={statusMutation.isPending}
              className="button button-quiet"
              type="button"
            >
              {admin.enabled ? (
                <>
                  <ToggleRight size={15} className="text-forest-2" />
                  <span>Disable account</span>
                </>
              ) : (
                <>
                  <ToggleLeft size={15} className="text-muted" />
                  <span>Enable account</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                if (window.confirm('Delete this tenant administrator account?')) {
                  deleteMutation.mutate()
                }
              }}
              disabled={deleteMutation.isPending}
              className="button button-danger"
              type="button"
            >
              <Trash2 size={13} /> Delete administrator
            </button>
          </div>
        </div>
      )}

      {/* Tenant Admin Dialog Modal via Portal to avoid stacking context traps */}
      {showForm &&
        createPortal(
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleSubmit}>
                <div className="modal-header">
                  <div>
                    <p className="eyebrow">TENANT ACCESS</p>
                    <h2>{isEdit ? 'Edit administrator' : 'Tenant administrator'}</h2>
                    <p className="muted text-xs">Organization #{orgId}</p>
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

                {errorMsg && (
                  <p className="form-error">{errorMsg}</p>
                )}

                <div className="form-grid">
                  <label className="field form-span">
                    <span>Username</span>
                    <input
                      id="tenantAdminUsername"
                      maxLength={100}
                      placeholder="foodfast-admin"
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      required
                      autoFocus
                    />
                  </label>

                  <label className="field form-span">
                    <span>Password</span>
                    <input
                      id="tenantAdminPassword"
                      type="password"
                      maxLength={100}
                      placeholder={isEdit ? 'Leave blank to keep existing password' : 'Minimum 8 characters'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required={!isEdit}
                    />
                  </label>

                  <label className="switch-row form-span">
                    <span>
                      <strong>Account enabled</strong>
                      <small>Disabled users cannot log in.</small>
                    </span>
                    <input
                      id="tenantAdminEnabled"
                      type="checkbox"
                      checked={form.enabled}
                      onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                    />
                  </label>
                </div>

                <div className="modal-actions split-actions">
                  {isEdit ? (
                    <button
                      className="button button-danger"
                      type="button"
                      onClick={() => {
                        if (window.confirm('Delete this tenant administrator?')) {
                          deleteMutation.mutate()
                        }
                      }}
                    >
                      Delete administrator
                    </button>
                  ) : (
                    <span />
                  )}
                  <span />
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
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? 'Saving…'
                      : 'Save administrator'}
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
