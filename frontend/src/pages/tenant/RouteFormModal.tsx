import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createRoute,
  updateRoute,
  type ApiRoute,
  type RouteRequest,
  type HeaderRuleRequest,
} from '@/features/routes/routeApi'
import { Plus, Trash2, X, AlertCircle } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  route?: ApiRoute | null
  tenantSlug?: string
}

const AVAILABLE_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']

export default function RouteFormModal({ isOpen, onClose, route, tenantSlug }: Props) {
  const queryClient = useQueryClient()
  const isEdit = !!route

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (route) {
      setRouteId(route.routeId)
      setName(route.name)
      setPathPattern(route.pathPattern)
      setTargetBaseUrl(route.targetBaseUrl)
      setTargetPathPrefix(route.targetPathPrefix)
      setRequestsPerMinute(route.requestsPerMinute)
      setResponseTimeoutMs(route.responseTimeoutMs)
      setIdempotencyEnabled(route.idempotencyEnabled)
      setActive(route.active)
      setAllowedMethods(route.allowedMethods || ['GET'])
      setHeaderRules(
        route.headerRules?.map((r) => ({
          direction: r.direction,
          action: r.action,
          headerName: r.headerName || r.header_name || '',
          headerValue: r.headerValue || r.header_value || '',
        })) || []
      )
    } else {
      const defaultPrefix = tenantSlug ? `/${tenantSlug}/` : '/'
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
    setErrorMessage(null)
  }, [route, tenantSlug, isOpen])

  const createMutation = useMutation({
    mutationFn: createRoute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      onClose()
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to create route')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: RouteRequest) => updateRoute(route!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['routes'] })
      queryClient.invalidateQueries({ queryKey: ['route', route!.id] })
      onClose()
    },
    onError: (err: any) => {
      setErrorMessage(err.response?.data?.message || err.message || 'Failed to update route')
    },
  })

  if (!isOpen) return null

  const toggleMethod = (method: string) => {
    if (allowedMethods.includes(method)) {
      if (allowedMethods.length === 1) return // at least one method required
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
    setErrorMessage(null)

    if (tenantSlug && !pathPattern.startsWith(`/${tenantSlug}/`)) {
      setErrorMessage(`Path Pattern must start with /${tenantSlug}/`)
      return
    }

    if (!targetPathPrefix.startsWith('/')) {
      setErrorMessage('Target Path Prefix must start with /')
      return
    }

    try {
      const url = new URL(targetBaseUrl)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        setErrorMessage('Target Base URL must start with http:// or https://')
        return
      }
    } catch {
      setErrorMessage('Target Base URL is not a valid URL (e.g. http://localhost:8080)')
      return
    }

    for (const rule of headerRules) {
      if (!rule.headerName.trim()) {
        setErrorMessage('Header Rule: Header name is required.')
        return
      }
      if (rule.action === 'ADD' && (!rule.headerValue || !rule.headerValue.trim())) {
        setErrorMessage('Header Rule: ADD action requires a header value.')
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

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] flex flex-col my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-bold">{isEdit ? 'Edit API Route' : 'Create New API Route'}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-sm bg-destructive/10 border border-destructive/20 text-destructive rounded-md">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Route ID <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={routeId}
                disabled={isEdit}
                onChange={(e) => setRouteId(e.target.value)}
                placeholder="e.g. users-service"
                required
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background font-mono focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
              />
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {isEdit ? 'Immutable route identifier.' : 'Unique identifier for this route.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Route Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Users API Service"
                required
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Path Pattern <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={pathPattern}
                onChange={(e) => setPathPattern(e.target.value)}
                placeholder={tenantSlug ? `/${tenantSlug}/users/**` : '/users/**'}
                required
                className="w-full border border-input rounded-md px-3 py-2 text-sm font-mono bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {tenantSlug && `Must start with /${tenantSlug}/`}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Target Path Prefix <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={targetPathPrefix}
                onChange={(e) => setTargetPathPrefix(e.target.value)}
                placeholder="/api/v1"
                required
                className="w-full border border-input rounded-md px-3 py-2 text-sm font-mono bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">
              Target Base URL <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={targetBaseUrl}
              onChange={(e) => setTargetBaseUrl(e.target.value)}
              placeholder="http://users-service:8080"
              required
              className="w-full border border-input rounded-md px-3 py-2 text-sm font-mono bg-background focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Allowed HTTP Methods */}
          <div>
            <label className="block text-xs font-semibold mb-1.5">
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
                    className={`px-3 py-1 rounded text-xs font-mono font-semibold border transition ${
                      selected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border bg-muted/50 text-muted-foreground hover:bg-accent'
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
              <label className="block text-xs font-semibold mb-1">
                Requests Per Minute (Rate Limit) <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={requestsPerMinute}
                onChange={(e) => setRequestsPerMinute(Number(e.target.value))}
                required
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Response Timeout (ms) <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={responseTimeoutMs}
                onChange={(e) => setResponseTimeoutMs(Number(e.target.value))}
                required
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
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
                className="rounded border-input text-primary focus:ring-ring"
              />
              <span>Route Active</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={idempotencyEnabled}
                onChange={(e) => setIdempotencyEnabled(e.target.checked)}
                className="rounded border-input text-primary focus:ring-ring"
              />
              <span>Idempotency Enabled</span>
            </label>
          </div>

          {/* Header Rules Section */}
          <div className="pt-2 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Header Transformation Rules
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Inject or strip headers on incoming requests or outgoing responses.
                </p>
              </div>
              <button
                type="button"
                onClick={addHeaderRule}
                className="flex items-center gap-1 text-xs font-medium bg-muted hover:bg-accent px-2.5 py-1 rounded-md border border-border transition"
              >
                <Plus size={14} /> Add Rule
              </button>
            </div>

            {headerRules.length === 0 ? (
              <p className="text-xs text-muted-foreground italic bg-muted/40 p-3 rounded border border-border/50 text-center">
                No header rules added. Click "Add Rule" to configure request/response header rules.
              </p>
            ) : (
              <div className="space-y-2">
                {headerRules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row items-center gap-2 p-2.5 bg-muted/40 rounded-md border border-border"
                  >
                    <select
                      value={rule.direction}
                      onChange={(e) => updateHeaderRule(idx, 'direction', e.target.value)}
                      className="text-xs font-semibold border border-input rounded px-2 py-1.5 bg-background focus:outline-none"
                    >
                      <option value="REQUEST">REQUEST</option>
                      <option value="RESPONSE">RESPONSE</option>
                    </select>

                    <select
                      value={rule.action}
                      onChange={(e) => updateHeaderRule(idx, 'action', e.target.value)}
                      className="text-xs font-semibold border border-input rounded px-2 py-1.5 bg-background focus:outline-none"
                    >
                      <option value="ADD">ADD</option>
                      <option value="REMOVE">REMOVE</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Header Name (e.g. X-Tenant-Id)"
                      value={rule.headerName}
                      onChange={(e) => updateHeaderRule(idx, 'headerName', e.target.value)}
                      className="flex-1 text-xs font-mono border border-input rounded px-2.5 py-1.5 bg-background focus:outline-none"
                      required
                    />

                    {rule.action === 'ADD' && (
                      <input
                        type="text"
                        placeholder="Header Value"
                        value={rule.headerValue || ''}
                        onChange={(e) => updateHeaderRule(idx, 'headerValue', e.target.value)}
                        className="flex-1 text-xs font-mono border border-input rounded px-2.5 py-1.5 bg-background focus:outline-none"
                        required
                      />
                    )}

                    <button
                      type="button"
                      onClick={() => removeHeaderRule(idx)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded transition"
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
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border text-xs font-medium rounded-md hover:bg-accent transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="bg-primary text-primary-foreground px-4 py-2 text-xs font-semibold rounded-md hover:opacity-90 disabled:opacity-50 transition"
            >
              {isPending ? 'Saving Route…' : isEdit ? 'Save Route Changes' : 'Create Route'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
