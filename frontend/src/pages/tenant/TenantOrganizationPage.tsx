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
  { label: string; bg: string; text: string; border: string }
> = {
  ACTIVE: {
    label: 'ACTIVE',
    bg: 'bg-green-500/10',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-500/20',
  },
  PENDING: {
    label: 'PENDING',
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-500/20',
  },
  SUSPENDED: {
    label: 'SUSPENDED',
    bg: 'bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/20',
  },
  DELETED: {
    label: 'DELETED',
    bg: 'bg-gray-500/10',
    text: 'text-gray-600 dark:text-gray-400',
    border: 'border-gray-500/20',
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
        <div className="text-muted-foreground text-sm animate-pulse">
          Loading organization details…
        </div>
      </div>
    )
  }

  if (isError || !organization) {
    return (
      <div className="p-6 bg-card border border-destructive/20 text-destructive rounded-lg max-w-xl">
        <p className="font-semibold">Unable to load organization</p>
        <p className="text-sm mt-1">
          {(error as any)?.response?.data?.message || 'Could not fetch your organization profile.'}
        </p>
      </div>
    )
  }

  const statusStyle = STATUS_CONFIG[organization.status] || STATUS_CONFIG.PENDING

  return (
    <div className="max-w-4xl space-y-6">
      {/* Title & Status Summary Card */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
            <Building2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold">{organization.name}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
              >
                {statusStyle.label}
              </span>
            </div>
            <p className="text-muted-foreground text-sm font-mono mt-0.5">
              slug: /{organization.slug} • id: #{organization.id}
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center gap-2 p-4 text-sm bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 rounded-lg">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-4 text-sm bg-destructive/10 border border-destructive/20 text-destructive rounded-lg">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Grid: Edit Form & Metadata */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organization Form */}
        <div className="lg:col-span-2 bg-card border border-border rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 pb-4 mb-5 border-b border-border">
            <ShieldCheck size={18} className="text-muted-foreground" />
            <h2 className="text-base font-semibold">Organization Profile</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Organization Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                className="w-full border border-input rounded-md px-3.5 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.name}
                maxLength={150}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">Maximum 150 characters.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Organization Slug</label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  disabled
                  value={organization.slug}
                  className="w-full border border-input font-mono text-xs rounded-md pl-3.5 pr-8 py-2 bg-muted text-muted-foreground cursor-not-allowed select-none"
                />
                <Lock size={14} className="absolute right-3 top-2.5 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Your API gateway routes are prefixed with <span className="font-mono">/{organization.slug}/</span>. Slug changes must be requested through platform administration.
              </p>
            </div>

            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setForm({ name: organization.name })}
                className="px-4 py-2 border border-border text-sm font-medium rounded-md hover:bg-accent transition"
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={updateMutation.isPending || form.name === organization.name}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
              >
                <Save size={16} />
                {updateMutation.isPending ? 'Saving changes…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Metadata Card */}
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm space-y-5 h-fit">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-3">
            Tenant Information
          </h3>

          <div className="space-y-4 text-sm">
            <div>
              <span className="text-xs text-muted-foreground block mb-0.5">Organization ID</span>
              <span className="font-mono font-medium">#{organization.id}</span>
            </div>

            <div>
              <span className="text-xs text-muted-foreground block mb-0.5">Route Prefix</span>
              <span className="font-mono text-xs font-semibold px-2 py-1 bg-muted rounded">
                /{organization.slug}/*
              </span>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar size={16} className="text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground block">Created At</span>
                <span className="font-medium">
                  {new Date(organization.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock size={16} className="text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <span className="text-xs text-muted-foreground block">Last Updated</span>
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
