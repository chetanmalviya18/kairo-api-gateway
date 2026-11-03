import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
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
  Building2,
  Calendar,
  Clock,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Save,
} from 'lucide-react'

const STATUS_CONFIG: Record<
  Organization['status'],
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
    enabled: !isNaN(id),
  })

  useEffect(() => {
    if (organization) {
      setForm({
        name: organization.name,
        slug: organization.slug,
      })
    }
  }, [organization])

  const updateMutation = useMutation({
    mutationFn: (data: OrganizationRequest) => updateOrganization(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['organization', id], updated)
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      setSuccessMessage('Organization details updated successfully!')
      setErrorMessage(null)
      setTimeout(() => setSuccessMessage(null), 4000)
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to update organization'
      setErrorMessage(msg)
      setSuccessMessage(null)
    },
  })

  const statusMutation = useMutation({
    mutationFn: (newStatus: Organization['status']) =>
      changeOrganizationStatus(id, { status: newStatus }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['organization', id], updated)
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      setSuccessMessage(`Status updated to ${updated.status}`)
      setErrorMessage(null)
      setTimeout(() => setSuccessMessage(null), 4000)
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to change status'
      setErrorMessage(msg)
      setSuccessMessage(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      navigate('/platform/organizations')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to delete organization'
      setErrorMessage(msg)
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
        <div className="text-muted-foreground text-xs animate-pulse">
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
          className="flex items-center gap-1.5 text-muted-foreground hover:text-kairo-navy text-xs transition"
        >
          <ArrowLeft size={16} /> Back to Organizations
        </button>
        <div className="p-6 bg-white border border-destructive/20 text-destructive rounded-xl shadow-sm">
          <p className="font-semibold text-sm">Organization not found</p>
          <p className="text-xs mt-1">
            {(error as any)?.response?.data?.message || 'Could not fetch organization with ID ' + id}
          </p>
        </div>
      </div>
    )
  }

  const statusStyle = STATUS_CONFIG[organization.status] || STATUS_CONFIG.PENDING

  return (
    <div className="max-w-4xl space-y-6">
      {/* Top Header / Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => navigate('/platform/organizations')}
          className="flex items-center gap-1.5 text-muted-foreground hover:text-kairo-navy text-xs font-semibold transition"
        >
          <ArrowLeft size={16} /> Back to Organizations
        </button>

        <div className="flex items-center gap-2.5">
          <Link
            to={`/platform/organizations/${id}/admin`}
            className="flex items-center gap-2 text-xs font-semibold border border-kairo-cream-border bg-white hover:bg-kairo-cream px-3.5 py-2 rounded-lg transition shadow-xs text-kairo-navy"
          >
            <Key size={14} className="text-kairo-green" /> Manage Tenant Admin
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-2 text-xs font-semibold text-destructive hover:bg-destructive/10 border border-destructive/20 px-3.5 py-2 rounded-lg transition"
            title="Delete Organization"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>

      {/* Title & Status Summary Card */}
      <div className="bg-white border border-kairo-cream-border rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-kairo-navy text-white flex items-center justify-center font-bold text-xl shadow-md">
            <Building2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-kairo-navy">{organization.name}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusStyle.badgeClass}`}
              >
                {statusStyle.label}
              </span>
            </div>
            <p className="text-muted-foreground text-xs font-mono mt-0.5">
              slug: /{organization.slug} • id: #{organization.id}
            </p>
          </div>
        </div>

        {/* Status Actions */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
            Status:
          </label>
          <select
            className="text-xs font-semibold border border-kairo-cream-border bg-white rounded-lg px-3 py-2 text-kairo-navy focus:outline-none focus:ring-2 focus:ring-kairo-green cursor-pointer"
            value={organization.status}
            disabled={statusMutation.isPending}
            onChange={(e) => statusMutation.mutate(e.target.value as Organization['status'])}
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="PENDING">PENDING</option>
            <option value="SUSPENDED">SUSPENDED</option>
          </select>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center gap-2 p-4 text-xs font-medium bg-kairo-green/10 border border-kairo-green/20 text-kairo-green rounded-xl">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-4 text-xs font-medium bg-destructive/10 border border-destructive/20 text-destructive rounded-xl">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Edit Form & Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit Form */}
        <div className="lg:col-span-2 bg-white border border-kairo-cream-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 mb-5 border-b border-kairo-cream-border">
            <ShieldCheck size={18} className="text-kairo-green" />
            <h2 className="text-sm font-bold text-kairo-navy">Edit Organization Details</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Organization Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                className="w-full border border-kairo-cream-border rounded-lg px-3.5 py-2.5 text-sm bg-kairo-cream/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-kairo-green transition"
                value={form.name}
                maxLength={150}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <p className="text-[11px] text-muted-foreground mt-1">Maximum 150 characters.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Slug <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                className="w-full border border-kairo-cream-border font-mono text-xs rounded-lg px-3.5 py-2.5 bg-kairo-cream/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-kairo-green transition"
                value={form.slug}
                maxLength={100}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
                required
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Used in gateway route prefix: <span className="font-mono">/{form.slug || '...'}/</span>. Lowercase letters, numbers, and single hyphens.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setForm({
                    name: organization.name,
                    slug: organization.slug,
                  })
                }
                className="px-4 py-2 border border-kairo-cream-border text-xs font-semibold rounded-lg hover:bg-kairo-cream transition"
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={
                  updateMutation.isPending ||
                  (form.name === organization.name && form.slug === organization.slug)
                }
                className="flex items-center gap-2 bg-kairo-navy hover:bg-kairo-navy-light text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-sm disabled:opacity-50 transition"
              >
                <Save size={15} />
                {updateMutation.isPending ? 'Saving changes…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Metadata Card */}
        <div className="bg-white border border-kairo-cream-border rounded-xl p-6 shadow-sm space-y-5 h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-kairo-navy border-b border-kairo-cream-border pb-3">
            Metadata & Audit
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <span className="text-[11px] text-muted-foreground block mb-0.5">Organization ID</span>
              <span className="font-mono font-bold text-kairo-navy text-sm">#{organization.id}</span>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar size={16} className="text-kairo-green mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] text-muted-foreground block">Created At</span>
                <span className="font-medium">
                  {new Date(organization.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock size={16} className="text-kairo-navy mt-0.5 shrink-0" />
              <div>
                <span className="text-[11px] text-muted-foreground block">Last Updated</span>
                <span className="font-medium">
                  {new Date(organization.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
