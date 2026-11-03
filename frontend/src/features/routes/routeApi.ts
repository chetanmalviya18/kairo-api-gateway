import apiClient from '@/lib/apiClient'

export interface HeaderRule {
  id?: number
  direction: 'REQUEST' | 'RESPONSE'
  action: 'ADD' | 'REMOVE'
  headerName?: string
  header_name?: string
  headerValue?: string
  header_value?: string
}

export interface HeaderRuleRequest {
  direction: string
  action: string
  headerName: string
  headerValue?: string
}

export interface ApiRoute {
  id: number
  organizationId: number
  routeId: string
  name: string
  pathPattern: string
  targetBaseUrl: string
  targetPathPrefix: string
  allowedMethods: string[]
  requestsPerMinute: number
  responseTimeoutMs: number
  idempotencyEnabled: boolean
  active: boolean
  configurationVersion: number
  headerRules: HeaderRule[]
  createdAt: string
  updatedAt: string
}

export interface RouteRequest {
  routeId: string
  name: string
  pathPattern: string
  targetBaseUrl: string
  targetPathPrefix: string
  allowedMethods: string[]
  requestsPerMinute: number
  responseTimeoutMs: number
  idempotencyEnabled: boolean
  active: boolean
  headerRules: HeaderRuleRequest[]
}

export interface RouteStatusRequest {
  active: boolean
}

export interface RouteVersionResponse {
  id: number
  routeId: string
  versionNumber: number
  changeType: string
  configurationSnapshot: string
  createdAt: string
}

export interface AuditRecordResponse {
  id: number
  actor: string
  action: string
  resourceType: string
  resourceId: string
  correlationId: string
  durationMs: number
  result: string
  details: string
  createdAt: string
}

// ── Tenant Route Endpoints ───────────────────────────────────────────────────

export const getRoutes = async (): Promise<ApiRoute[]> => {
  const res = await apiClient.get<ApiRoute[]>('/api/tenant/routes')
  return res.data
}

export const getRoute = async (id: number): Promise<ApiRoute> => {
  const res = await apiClient.get<ApiRoute>(`/api/tenant/routes/${id}`)
  return res.data
}

export const createRoute = async (data: RouteRequest): Promise<ApiRoute> => {
  const res = await apiClient.post<ApiRoute>('/api/tenant/routes', data)
  return res.data
}

export const updateRoute = async (id: number, data: RouteRequest): Promise<ApiRoute> => {
  const res = await apiClient.put<ApiRoute>(`/api/tenant/routes/${id}`, data)
  return res.data
}

export const changeRouteStatus = async (
  id: number,
  data: RouteStatusRequest
): Promise<ApiRoute> => {
  const res = await apiClient.patch<ApiRoute>(`/api/tenant/routes/${id}/status`, data)
  return res.data
}

export const deleteRoute = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/tenant/routes/${id}`)
}

export const getRouteVersions = async (routeId: string): Promise<RouteVersionResponse[]> => {
  const res = await apiClient.get<RouteVersionResponse[]>(`/api/tenant/route-versions/${routeId}`)
  return res.data
}

export const getAuditRecords = async (): Promise<AuditRecordResponse[]> => {
  const res = await apiClient.get<AuditRecordResponse[]>('/api/tenant/audit-records')
  return res.data
}
