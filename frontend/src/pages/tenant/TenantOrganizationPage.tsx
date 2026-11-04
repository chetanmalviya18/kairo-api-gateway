import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTenantOrganization,
  updateTenantOrganization,
  type TenantOrganizationRequest,
} from '@/features/organizations/organizationApi'
import { CheckCircle2 } from 'lucide-react'
import { parseApiError, type ParsedApiError } from '@/lib/errorHandler'
import FormErrorBanner from '@/components/common/FormErrorBanner'

export default function TenantOrganizationPage() {
  const queryClient = useQueryClient()

  const [form, setForm] = useState<TenantOrganizationRequest>({ name: '' })
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [apiError, setApiError] = useState<ParsedApiError | null>(null)

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
    mutationFn: (payload: TenantOrganizationRequest) => updateTenantOrganization(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['tenant-organization'], updated)
      queryClient.invalidateQueries({ queryKey: ['tenant-audit-records'] })
      setSuccessMessage('Organization display name updated successfully.')
      setApiError(null)
    },
    onError: (err: any) => {
      setApiError(parseApiError(err, 'Failed to update organization name'))
      setSuccessMessage(null)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)
    setSuccessMessage(null)

    if (!form.name.trim()) {
      setApiError({
        status: 400,
        message: 'Validation Failed',
        fieldErrors: { name: 'Organization name cannot be blank.' },
        formattedMessage: 'Organization name cannot be blank.',
      })
      return
    }

    updateMutation.mutate(form)
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
      <div className="p-6 bg-white border border-red-200 text-red-700 rounded-xl max-w-xl">
        <p className="font-semibold text-sm">Unable to load organization</p>
        <p className="text-xs mt-1">
          {parseApiError(error, 'Could not fetch your organization profile.').formattedMessage}
        </p>
      </div>
    )
  }

  return (
    <section className="page-section">
      {/* Section Heading */}
      <div className="section-heading">
        <div>
          <p className="eyebrow">TENANT PROFILE</p>
          <h1>My organization</h1>
          <p className="muted">View tenant identity and update the display name.</p>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center gap-2 p-3.5 mb-6 text-xs font-medium bg-forest/10 border border-forest/20 text-forest rounded-xl">
          <CheckCircle2 size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      <FormErrorBanner error={apiError} className="mb-6" />

      {/* Profile Grid */}
      <div className="profile-grid">
        {/* Profile Card (Identity) */}
        <div className="profile-card">
          <div className="flex items-center justify-between">
            <h2>{organization.name}</h2>
            <span
              className={
                organization.status === 'ACTIVE'
                  ? 'status status-active'
                  : 'status status-inactive'
              }
            >
              {organization.status}
            </span>
          </div>
          <p className="muted text-xs mt-1">Tenant identity and gateway routing namespace.</p>

          <div className="profile-details">
            <div>
              <span>SLUG / ROUTE NAMESPACE</span>
              <strong className="text-forest-2 font-mono">/{organization.slug}</strong>
            </div>

            <div>
              <span>TENANT ID</span>
              <strong className="font-mono">#{organization.id}</strong>
            </div>

            <div>
              <span>CREATED AT</span>
              <strong className="font-mono">
                {organization.createdAt
                  ? new Date(organization.createdAt).toLocaleString()
                  : '—'}
              </strong>
            </div>

            <div>
              <span>UPDATED AT</span>
              <strong className="font-mono">
                {organization.updatedAt
                  ? new Date(organization.updatedAt).toLocaleString()
                  : '—'}
              </strong>
            </div>
          </div>
        </div>

        {/* Profile Edit Card */}
        <form onSubmit={handleSubmit} className="profile-edit">
          <div>
            <p className="eyebrow text-lime">ORGANIZATION SETTINGS</p>
            <h3>Update name</h3>
            <p>Modify the tenant display name. Route slug remains immutable.</p>
          </div>

          <label className={`field ${apiError?.fieldErrors?.name ? 'field-has-error' : ''}`}>
            <span className="text-[#f7f4e8]">Display Name</span>
            <input
              value={form.name}
              onChange={(e) => {
                setForm({ name: e.target.value })
                if (apiError?.fieldErrors?.name) {
                  setApiError(prev => prev ? { ...prev, fieldErrors: { ...prev.fieldErrors, name: '' } } : null)
                }
              }}
              placeholder="Organization Name"
              required
              className="bg-white text-ink"
            />
            {apiError?.fieldErrors?.name && (
              <span className="field-error-msg">{apiError.fieldErrors.name}</span>
            )}
          </label>

          <label className="field">
            <span className="text-[#f7f4e8]/60">Slug (Immutable)</span>
            <input
              value={organization.slug}
              disabled
              className="bg-white/10 text-[#f7f4e8]/50 border-white/20 cursor-not-allowed font-mono text-xs"
            />
          </label>

          <button
            type="submit"
            disabled={updateMutation.isPending || !form.name.trim()}
            className="button"
          >
            {updateMutation.isPending ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      </div>
    </section>
  )
}
