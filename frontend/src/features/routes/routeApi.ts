import apiClient from '@/lib/apiClient'

export interface HeaderRule {
  id: number
  direction: 'REQUEST' | 'RESPONSE'
  action: 'ADD' | 'REMOVE'
  headerName: string
  headerValue?: string
}

export interface ApiRoute {
  id: number
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

export interface HeaderRuleRequest {
  direction: string
  action: string
  headerName: string
  headerValue?: string
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
