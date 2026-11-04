import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPortal } from 'react-dom'
import {
  createRoute,
  updateRoute,
  type ApiRoute,
  type RouteRequest,
  type HeaderRuleRequest,
} from '@/features/routes/routeApi'
import { Plus, Trash2, X } from 'lucide-react'
import { parseApiError, type ParsedApiError } from '@/lib/errorHandler'
import FormErrorBanner from '@/components/common/FormErrorBanner'

interface Props {
  isOpen: boolean
  onClose: () => void
  route?: ApiRoute | null
  initialData?: ApiRoute | null
  tenantSlug?: string
  organizationSlug?: string
}

const AVAILABLE_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']

export default function RouteFormModal({
  isOpen,
  onClose,
  route,
  initialData,
  tenantSlug,
  organizationSlug,
}: Props) {
  const queryClient = useQueryClient()
  const activeRoute = route || initialData
  const activeSlug = tenantSlug || organizationSlug
  const isEdit = !!activeRoute

  const [routeId, setRouteId] = useState('')
  const [name, setName] = useState('')
  const [pathPattern, setPathPattern] = useState('')
  const [targetBaseUrl, setTargetBaseUrl] = useState('')
  const [targetPathPrefix, setTargetPathPrefix] = useState('/')
  const [requestsPerMinute, setRequestsPerMinute] = useState<number>(60)
  const [responseTimeoutMs, setResponseTimeoutMs] = useState<number>(5000)
  const [idempotencyEnabled, setIdempotencyEnabled] = useState(false)
  const [active, setActive] = useState(true)
  const [allowedMethods, setAllowedMethods] = useState<string[]>(['GET'])
  const [headerRules, setHeaderRules] = useState<HeaderRuleRequest[]>([])
  const [apiError, setApiError] = useState<ParsedApiError | null>(null)

  useEffect(() => {
    if (activeRoute) {
      setRouteId(activeRoute.routeId)
      setName(activeRoute.name)
      setPathPattern(activeRoute.pathPattern)
      setTargetBaseUrl(activeRoute.targetBaseUrl)
      setTargetPathPrefix(activeRoute.targetPathPrefix)
      setRequestsPerMinute(activeRoute.requestsPerMinute)
      setResponseTimeoutMs(activeRoute.responseTimeoutMs)
      setIdempotencyEnabled(activeRoute.idempotencyEnabled)
      setActive(activeRoute.active)
      setAllowedMethods(activeRoute.allowedMethods || ['GET'])
      setHeaderRules(
        activeRoute.headerRules?.map((r) => ({
          direction: r.direction,
          action: r.action,
          headerName: r.headerName || r.header_name || '',
          headerValue: r.headerValue || r.header_value || '',
        })) || []
      )
    } else {
      const defaultPrefix = activeSlug ? `/${activeSlug}/` : '/'
      setRouteId('')
      setName('')
      setPathPattern(defaultPrefix)
      setTargetBaseUrl('http://localhost:8080')
      setTargetPathPrefix('/')
      setRequestsPerMinute(60)
      setResponseTimeoutMs(5000)
      setIdempotencyEnabled(false)
      setActive(true)
      setAllowedMethods(['GET'])
      setHeaderRules([])
    }
    setApiError(null)
  }, [activeRoute, activeSlug, isOpen])

  const createMutation = useMutation({
    mutationFn: createRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      queryClient.invalidateQueries({ queryKey: ['tenant-audit-records'] })
      onClose()
    },
    onError: (err: any) => {
      setApiError(parseApiError(err, 'Failed to create route'))
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: RouteRequest) => updateRoute(activeRoute!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      queryClient.invalidateQueries({ queryKey: ['route', activeRoute!.id] })
      queryClient.invalidateQueries({ queryKey: ['tenant-audit-records'] })
      onClose()
    },
    onError: (err: any) => {
      setApiError(parseApiError(err, 'Failed to update route'))
    },
  })

  if (!isOpen) return null

  const toggleMethod = (method: string) => {
    if (allowedMethods.includes(method)) {
      if (allowedMethods.length === 1) return
      setAllowedMethods(allowedMethods.filter((m) => m !== method))
    } else {
      setAllowedMethods([...allowedMethods, method])
    }
  }

  const addHeaderRule = () => {
    setHeaderRules([
      ...headerRules,
      { direction: 'REQUEST', action: 'ADD', headerName: '', headerValue: '' },
    ])
  }

  const updateHeaderRule = (index: number, field: keyof HeaderRuleRequest, value: string) => {
    const updated = [...headerRules]
    updated[index] = { ...updated[index], [field]: value }
    setHeaderRules(updated)
  }

  const removeHeaderRule = (index: number) => {
    setHeaderRules(headerRules.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)

    if (tenantSlug && !pathPattern.startsWith(`/${tenantSlug}/`)) {
      setApiError({
        status: 400,
        message: 'Validation Failed',
        fieldErrors: { pathPattern: `Path Pattern must start with /${tenantSlug}/` },
        formattedMessage: `Validation Failed (pathPattern: Must start with /${tenantSlug}/)`,
      })
      return
    }

    if (!targetPathPrefix.startsWith('/')) {
      setApiError({
        status: 400,
        message: 'Validation Failed',
        fieldErrors: { targetPathPrefix: 'Target Path Prefix must start with /' },
        formattedMessage: 'Validation Failed (targetPathPrefix: Must start with /)',
      })
      return
    }

    try {
      const url = new URL(targetBaseUrl)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        setApiError({
          status: 400,
          message: 'Validation Failed',
          fieldErrors: { targetBaseUrl: 'Target Base URL must start with http:// or https://' },
          formattedMessage: 'Validation Failed (targetBaseUrl: Must start with http:// or https://)',
        })
        return
      }
    } catch {
      setApiError({
        status: 400,
        message: 'Validation Failed',
        fieldErrors: { targetBaseUrl: 'Target Base URL is not a valid URL (e.g. http://localhost:8080)' },
        formattedMessage: 'Validation Failed (targetBaseUrl: Invalid URL)',
      })
      return
    }

    for (const rule of headerRules) {
      if (!rule.headerName.trim()) {
        setApiError({
          status: 400,
          message: 'Validation Failed',
          fieldErrors: { headerRules: 'Header Rule: Header name is required.' },
          formattedMessage: 'Validation Failed (headerRules: Header name is required.)',
        })
        return
      }
      if (rule.action === 'ADD' && (!rule.headerValue || !rule.headerValue.trim())) {
        setApiError({
          status: 400,
          message: 'Validation Failed',
          fieldErrors: { headerRules: 'Header Rule: ADD action requires a header value.' },
          formattedMessage: 'Validation Failed (headerRules: ADD action requires a header value.)',
        })
        return
      }
    }

    const payload: RouteRequest = {
      routeId,
      name,
      pathPattern,
      targetBaseUrl,
      targetPathPrefix,
      requestsPerMinute,
      responseTimeoutMs,
      idempotencyEnabled,
      active,
      allowedMethods,
      headerRules,
    }

    if (isEdit) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-[#17221d]/65 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-kairo-cream-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col my-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-kairo-cream-border bg-kairo-cream/60">
          <div>
            <h2 className="text-base font-bold text-ink">
              {isEdit ? 'Edit API Route' : 'Create New API Route'}
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Define matching rules and upstream routing specifications
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-kairo-green p-1.5 rounded-lg hover:bg-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 bg-white">
          <FormErrorBanner error={apiError} className="mb-4" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Route ID <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={routeId}
                disabled={isEdit}
                onChange={(e) => {
                  setRouteId(e.target.value)
                  if (apiError?.fieldErrors?.routeId) {
                    setApiError(prev => prev ? { ...prev, fieldErrors: { ...prev.fieldErrors, routeId: '' } } : null)
                  }
                }}
                placeholder="e.g. users-service"
                required
                className={`w-full border rounded-lg px-3 py-2 text-sm bg-kairo-cream/30 font-mono focus:bg-white focus:outline-none focus:ring-2 disabled:opacity-60 ${
                  apiError?.fieldErrors?.routeId
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-kairo-cream-border focus:ring-kairo-green'
                }`}
              />
              {apiError?.fieldErrors?.routeId ? (
                <p className="text-[11px] text-red-600 font-medium mt-1">{apiError.fieldErrors.routeId}</p>
              ) : (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {isEdit ? 'Immutable route identifier.' : 'Unique identifier for this route.'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Route Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (apiError?.fieldErrors?.name) {
                    setApiError(prev => prev ? { ...prev, fieldErrors: { ...prev.fieldErrors, name: '' } } : null)
                  }
                }}
                placeholder="e.g. Users API Service"
                required
                className={`w-full border rounded-lg px-3 py-2 text-sm bg-kairo-cream/30 focus:bg-white focus:outline-none focus:ring-2 ${
                  apiError?.fieldErrors?.name
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-kairo-cream-border focus:ring-kairo-green'
                }`}
              />
              {apiError?.fieldErrors?.name && (
                <p className="text-[11px] text-red-600 font-medium mt-1">{apiError.fieldErrors.name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Ingress Path Pattern <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={pathPattern}
                onChange={(e) => {
                  setPathPattern(e.target.value)
                  if (apiError?.fieldErrors?.pathPattern) {
                    setApiError(prev => prev ? { ...prev, fieldErrors: { ...prev.fieldErrors, pathPattern: '' } } : null)
                  }
                }}
                placeholder={tenantSlug ? `/${tenantSlug}/users/**` : '/users/**'}
                required
                className={`w-full border rounded-lg px-3 py-2 text-sm font-mono bg-kairo-cream/30 focus:bg-white focus:outline-none focus:ring-2 ${
                  apiError?.fieldErrors?.pathPattern
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-kairo-cream-border focus:ring-kairo-green'
                }`}
              />
              {apiError?.fieldErrors?.pathPattern ? (
                <p className="text-[11px] text-red-600 font-medium mt-1">{apiError.fieldErrors.pathPattern}</p>
              ) : (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {tenantSlug && `Must start with /${tenantSlug}/`}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Target Path Prefix <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={targetPathPrefix}
                onChange={(e) => {
                  setTargetPathPrefix(e.target.value)
                  if (apiError?.fieldErrors?.targetPathPrefix) {
                    setApiError(prev => prev ? { ...prev, fieldErrors: { ...prev.fieldErrors, targetPathPrefix: '' } } : null)
                  }
                }}
                placeholder="/api/v1"
                required
                className={`w-full border rounded-lg px-3 py-2 text-sm font-mono bg-kairo-cream/30 focus:bg-white focus:outline-none focus:ring-2 ${
                  apiError?.fieldErrors?.targetPathPrefix
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-kairo-cream-border focus:ring-kairo-green'
                }`}
              />
              {apiError?.fieldErrors?.targetPathPrefix && (
                <p className="text-[11px] text-red-600 font-medium mt-1">{apiError.fieldErrors.targetPathPrefix}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Target Base URL <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={targetBaseUrl}
              onChange={(e) => {
                setTargetBaseUrl(e.target.value)
                if (apiError?.fieldErrors?.targetBaseUrl) {
                  setApiError(prev => prev ? { ...prev, fieldErrors: { ...prev.fieldErrors, targetBaseUrl: '' } } : null)
                }
              }}
              placeholder="http://users-service:8080"
              required
              className={`w-full border rounded-lg px-3 py-2 text-sm font-mono bg-kairo-cream/30 focus:bg-white focus:outline-none focus:ring-2 ${
                apiError?.fieldErrors?.targetBaseUrl
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-kairo-cream-border focus:ring-kairo-green'
              }`}
            />
            {apiError?.fieldErrors?.targetBaseUrl && (
              <p className="text-[11px] text-red-600 font-medium mt-1">{apiError.fieldErrors.targetBaseUrl}</p>
            )}
          </div>

          {/* Allowed HTTP Methods */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Allowed HTTP Methods <span className="text-destructive">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_METHODS.map((method) => {
                const selected = allowedMethods.includes(method)
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => toggleMethod(method)}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition ${
                      selected
                        ? 'bg-kairo-green text-white border-kairo-green shadow-xs'
                        : 'border-kairo-cream-border bg-kairo-cream text-ink hover:bg-kairo-cream-border'
                    }`}
                  >
                    {method}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Rate limits & timeout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Requests Per Minute <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={requestsPerMinute}
                onChange={(e) => setRequestsPerMinute(Number(e.target.value))}
                required
                className="w-full border border-kairo-cream-border rounded-lg px-3 py-2 text-sm bg-kairo-cream/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-kairo-green"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Response Timeout (ms) <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={responseTimeoutMs}
                onChange={(e) => setResponseTimeoutMs(Number(e.target.value))}
                required
                className="w-full border border-kairo-cream-border rounded-lg px-3 py-2 text-sm bg-kairo-cream/30 focus:bg-white focus:outline-none focus:ring-2 focus:ring-kairo-green"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="flex items-center gap-6 pt-1">
            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="rounded border-kairo-cream-border text-kairo-green focus:ring-kairo-green"
              />
              <span>Route Active</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={idempotencyEnabled}
                onChange={(e) => setIdempotencyEnabled(e.target.checked)}
                className="rounded border-kairo-cream-border text-kairo-green focus:ring-kairo-green"
              />
              <span>Idempotency Enabled</span>
            </label>
          </div>

          {/* Header Rules Section */}
          <div className="pt-3 border-t border-kairo-cream-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                  Header Transformation Rules
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Inject or strip headers on incoming requests or outgoing responses
                </p>
              </div>
              <button
                type="button"
                onClick={addHeaderRule}
                className="flex items-center gap-1 text-xs font-semibold bg-kairo-cream hover:bg-kairo-cream-dark text-ink px-3 py-1.5 rounded-lg border border-kairo-cream-border transition"
              >
                <Plus size={14} className="text-kairo-green" /> Add Rule
              </button>
            </div>

            {headerRules.length === 0 ? (
              <p className="text-xs text-muted-foreground italic bg-kairo-cream/40 p-3.5 rounded-lg border border-kairo-cream-border/60 text-center">
                No header rules added. Click "Add Rule" to configure custom headers.
              </p>
            ) : (
              <div className="space-y-2.5">
                {headerRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-center gap-2 p-3 bg-kairo-cream/40 rounded-lg border border-kairo-cream-border"
                  >
                    <select
                      value={rule.direction}
                      onChange={(e) => updateHeaderRule(idx, 'direction', e.target.value)}
                      className="text-xs font-semibold border border-kairo-cream-border rounded-lg px-2.5 py-1.5 bg-white text-ink focus:outline-none"
                    >
                      <option value="REQUEST">REQUEST</option>
                      <option value="RESPONSE">RESPONSE</option>
                    </select>

                    <select
                      value={rule.action}
                      onChange={(e) => updateHeaderRule(idx, 'action', e.target.value)}
                      className="text-xs font-semibold border border-kairo-cream-border rounded-lg px-2.5 py-1.5 bg-white text-ink focus:outline-none"
                    >
                      <option value="ADD">ADD</option>
                      <option value="REMOVE">REMOVE</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Header Name"
                      value={rule.headerName}
                      onChange={(e) => updateHeaderRule(idx, 'headerName', e.target.value)}
                      className="flex-1 text-xs font-mono border border-kairo-cream-border rounded-lg px-3 py-1.5 bg-white focus:outline-none"
                      required
                    />

                    {rule.action === 'ADD' && (
                      <input
                        type="text"
                        placeholder="Header Value"
                        value={rule.headerValue || ''}
                        onChange={(e) => updateHeaderRule(idx, 'headerValue', e.target.value)}
                        className="flex-1 text-xs font-mono border border-kairo-cream-border rounded-lg px-3 py-1.5 bg-white focus:outline-none"
                        required
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => removeHeaderRule(idx)}
                      className="text-muted-foreground hover:text-destructive p-1.5 rounded-lg transition hover:bg-destructive/10"
                      title="Remove Rule"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-kairo-cream-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-kairo-cream-border text-xs font-semibold rounded-lg hover:bg-kairo-cream transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="bg-kairo-green hover:bg-kairo-green-dark text-white px-5 py-2 text-xs font-semibold rounded-lg shadow-sm hover:shadow transition disabled:opacity-50"
            >
              {isPending ? 'Saving Route…' : isEdit ? 'Save Route Changes' : 'Create Route'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
