import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getOrganization,
  updateOrganization,
  changeOrganizationStatus,
  deleteOrganization,
  type Organization,
  type OrganizationRequest,
} from '@/features/organizations/organizationApi'
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Users,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'

export default function OrganizationDetailPage() {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const id = Number(orgId)

  const [form, setForm] = useState<OrganizationRequest>({ name: '', slug: '' })
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    data: organization,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['organization', id],
    queryFn: () => getOrganization(id),
  })

  useEffect(() => {
    if (organization) {
      setForm({ name: organization.name, slug: organization.slug })
    }
  }, [organization])

  const updateMutation = useMutation({
    mutationFn: (payload: OrganizationRequest) => updateOrganization(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['organization', id], updated)
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      setSuccessMessage('Organization updated successfully.')
      setErrorMessage(null)
    },
    onError: (err: any) => {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to update organization'
      )
      setSuccessMessage(null)
    },
  })

  const statusMutation = useMutation({
    mutationFn: (status: Organization['status']) => changeOrganizationStatus(id, { status }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['organization', id], updated)
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      setSuccessMessage(`Status updated to ${updated.status}.`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      navigate('/platform/organizations')
    },
    onError: (err: any) => {
      setErrorMessage(
        err.response?.data?.message || err.message || 'Failed to delete organization'
      )
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    if (!slugRegex.test(form.slug)) {
      setErrorMessage(
        'Invalid slug: must contain only lowercase letters, numbers, and single hyphens without leading or trailing hyphens.'
      )
      return
    }

    updateMutation.mutate(form)
  }

  const handleDelete = () => {
    if (
      window.confirm(
        `Are you sure you want to delete "${organization?.name}"? This action soft-deletes the organization.`
      )
    ) {
      deleteMutation.mutate()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-muted text-xs animate-pulse">
          Loading organization details…
        </div>
      </div>
    )
  }

  if (isError || !organization) {
    return (
      <div className="space-y-4 max-w-xl">
        <button
          onClick={() => navigate('/platform/organizations')}
          className="button button-quiet inline-flex items-center gap-2 text-xs"
        >
          <ArrowLeft size={14} /> Back to Organizations
        </button>
        <div className="p-6 bg-white border border-red-200 text-red-700 rounded-xl">
          <p className="font-semibold text-sm">Organization not found</p>
          <p className="text-xs mt-1">
            {(error as any)?.response?.data?.message || 'Could not fetch organization with ID ' + id}
          </p>
        </div>
      </div>
    )
  }

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
          <p className="eyebrow">TENANT DIRECTORY</p>
          <h1>{organization.name}</h1>
          <p className="muted">Manage workspace configuration, route namespace and tenant status.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/platform/organizations/${id}/admins`)}
            className="button button-quiet"
            type="button"
          >
            <Users size={14} /> Manage Admin
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="button button-danger"
            type="button"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center gap-2 p-3.5 mb-6 text-xs font-medium bg-forest/10 border border-forest/20 text-forest rounded-xl">
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-3.5 mb-6 text-xs font-medium bg-red-50 border border-red-200 text-red-700 rounded-xl">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Profile Grid */}
      <div className="profile-grid">
        {/* Profile Card (Identity & Status) */}
        <div className="profile-card">
          <div className="flex items-center justify-between">
            <h2>{organization.name}</h2>
            <span
              className={
                organization.status === 'ACTIVE'
                  ? 'status status-active'
                  : 'status status-suspended'
              }
            >
              {organization.status}
            </span>
          </div>
          <p className="muted text-xs mt-1">Tenant identity, status and creation timestamps.</p>

          <div className="profile-details">
            <div>
              <span>SLUG / NAMESPACE</span>
              <strong className="text-forest-2 font-mono">/{organization.slug}</strong>
            </div>

            <div>
              <span>ORGANIZATION ID</span>
              <strong className="font-mono">#{organization.id}</strong>
            </div>

            <div>
              <span>STATUS</span>
              <strong className="font-mono">{organization.status}</strong>
            </div>

            <div>
              <span>CREATED AT</span>
              <strong className="font-mono">
                {organization.createdAt
                  ? new Date(organization.createdAt).toLocaleString()
                  : '—'}
              </strong>
            </div>
          </div>

          <div className="modal-actions mt-6 pt-4 flex gap-2">
            <button
              onClick={() =>
                statusMutation.mutate(
                  organization.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
                )
              }
              disabled={statusMutation.isPending}
              className="button button-quiet"
              type="button"
            >
              {organization.status === 'ACTIVE' ? (
                <>
                  <ToggleRight size={15} className="text-forest-2" />
                  <span>Suspend tenant</span>
                </>
              ) : (
                <>
                  <ToggleLeft size={15} className="text-muted" />
                  <span>Activate tenant</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSubmit} className="profile-edit">
          <div>
            <p className="eyebrow text-lime">ORGANIZATION SETTINGS</p>
            <h3>Edit identity</h3>
            <p>Update tenant display name and custom route prefix slug.</p>
          </div>

          <label className="field">
            <span className="text-[#f7f4e8]">Organization Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. FoodFast Corporation"
              required
              className="bg-white text-ink"
            />
          </label>

          <label className="field">
            <span className="text-[#f7f4e8]">Route Slug</span>
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
              placeholder="e.g. foodfast"
              required
              className="bg-white text-ink font-mono text-xs"
            />
          </label>

          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="button"
          >
            {updateMutation.isPending ? 'Saving…' : 'Save organization'}
          </button>
        </form>
      </div>
    </section>
  )
}
