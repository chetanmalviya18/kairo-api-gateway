import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTenantOrganization,
  updateTenantOrganization,
  type Organization,
  type TenantOrganizationRequest,
} from '@/features/organizations/organizationApi'
import {
  Building2,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
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

export default function TenantOrganizationPage() {
  const queryClient = useQueryClient()

  const [form, setForm] = useState<TenantOrganizationRequest>({ name: '' })
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const {
    data: organization,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['tenant-organization'],
    queryFn: getTenantOrganization,
  })

  useEffect(() => {
    if (organization) {
      setForm({ name: organization.name })
    }
  }, [organization])

  const updateMutation = useMutation({
    mutationFn: (data: TenantOrganizationRequest) => updateTenantOrganization(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['tenant-organization'], updated)
      setSuccessMessage('Organization name updated successfully!')
      setErrorMessage(null)
      setTimeout(() => setSuccessMessage(null), 4000)
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to update organization'
      setErrorMessage(msg)
      setSuccessMessage(null)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    if (!form.name.trim()) {
      setErrorMessage('Organization name cannot be blank.')
      return
    }

    updateMutation.mutate(form)
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
      <div className="p-6 bg-white border border-destructive/20 text-destructive rounded-xl max-w-xl shadow-sm">
        <p className="font-semibold text-sm">Unable to load organization</p>
        <p className="text-xs mt-1">
          {(error as any)?.response?.data?.message || 'Could not fetch your organization profile.'}
        </p>
      </div>
    )
  }

  const statusStyle = STATUS_CONFIG[organization.status] || STATUS_CONFIG.PENDING

  return (
    <div className="max-w-4xl space-y-6">
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
        {/* Organization Form */}
        <div className="lg:col-span-2 bg-white border border-kairo-cream-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 mb-5 border-b border-kairo-cream-border">
            <ShieldCheck size={18} className="text-kairo-green" />
            <h2 className="text-sm font-bold text-kairo-navy">Organization Profile</h2>
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
                Organization Slug
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  disabled
                  value={organization.slug}
                  className="w-full border border-kairo-cream-border font-mono text-xs rounded-lg pl-3.5 pr-8 py-2.5 bg-kairo-cream text-muted-foreground cursor-not-allowed select-none"
                />
                <Lock size={14} className="absolute right-3 top-3 text-muted-foreground" />
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Your API gateway routes are prefixed with <span className="font-mono">/{organization.slug}/</span>. Slug changes must be requested through platform administration.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setForm({ name: organization.name })}
                className="px-4 py-2 border border-kairo-cream-border text-xs font-semibold rounded-lg hover:bg-kairo-cream transition"
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={updateMutation.isPending || form.name === organization.name}
                className="flex items-center gap-2 bg-kairo-navy hover:bg-kairo-navy-light text-white px-5 py-2 rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
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
            Tenant Information
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <span className="text-[11px] text-muted-foreground block mb-0.5">Organization ID</span>
              <span className="font-mono font-bold text-kairo-navy text-sm">#{organization.id}</span>
            </div>

            <div>
              <span className="text-[11px] text-muted-foreground block mb-0.5">Route Ingress Prefix</span>
              <span className="font-mono text-xs font-bold text-kairo-navy px-2.5 py-1 bg-kairo-cream rounded-md border border-kairo-cream-border inline-block">
                /{organization.slug}/*
              </span>
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
