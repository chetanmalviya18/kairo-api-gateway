import apiClient from '@/lib/apiClient'

export interface Organization {
  id: number
  name: string
  slug: string
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DELETED'
  createdAt: string
  updatedAt: string
}

export interface OrganizationRequest {
  name: string
  slug: string
}

export interface OrganizationStatusRequest {
  status: Organization['status']
}

export interface TenantAdmin {
  id: number
  username: string
  enabled: boolean
  createdAt: string
}

export interface TenantAdminRequest {
  username: string
  password: string
  enabled: boolean
}

// ── Platform: Organizations ──────────────────────────────────────────────────

export const getOrganizations = async (): Promise<Organization[]> => {
  const res = await apiClient.get<Organization[]>('/platform/organizations')
  return res.data
}

export const getOrganization = async (id: number): Promise<Organization> => {
  const res = await apiClient.get<Organization>(`/platform/organizations/${id}`)
  return res.data
}

export const createOrganization = async (data: OrganizationRequest): Promise<Organization> => {
  const res = await apiClient.post<Organization>('/platform/organizations', data)
  return res.data
}

export const updateOrganization = async (
  id: number,
  data: OrganizationRequest
): Promise<Organization> => {
  const res = await apiClient.put<Organization>(`/platform/organizations/${id}`, data)
  return res.data
}

export const changeOrganizationStatus = async (
  id: number,
  data: OrganizationStatusRequest
): Promise<Organization> => {
  const res = await apiClient.patch<Organization>(`/platform/organizations/${id}/status`, data)
  return res.data
}

export const deleteOrganization = async (id: number): Promise<void> => {
  await apiClient.delete(`/platform/organizations/${id}`)
}

// ── Platform: Tenant Admins ──────────────────────────────────────────────────

export const getTenantAdmin = async (orgId: number): Promise<TenantAdmin> => {
  const res = await apiClient.get<TenantAdmin>(`/platform/organizations/${orgId}/admin`)
  return res.data
}

export const createTenantAdmin = async (
  orgId: number,
  data: TenantAdminRequest
): Promise<TenantAdmin> => {
  const res = await apiClient.post<TenantAdmin>(`/platform/organizations/${orgId}/admin`, data)
  return res.data
}

export const updateTenantAdmin = async (
  orgId: number,
  data: TenantAdminRequest
): Promise<TenantAdmin> => {
  const res = await apiClient.put<TenantAdmin>(`/platform/organizations/${orgId}/admin`, data)
  return res.data
}

export const deleteTenantAdmin = async (orgId: number): Promise<void> => {
  await apiClient.delete(`/platform/organizations/${orgId}/admin`)
}

