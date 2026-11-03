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

export interface TenantAdminStatusRequest {
  enabled: boolean
}

export interface TenantOrganizationRequest {
  name: string
}

// ── Platform: Organizations ──────────────────────────────────────────────────

export const getOrganizations = async (): Promise<Organization[]> => {
  const res = await apiClient.get<Organization[]>('/api/platform/organization')
  return res.data
}

export const getOrganization = async (id: number): Promise<Organization> => {
  const res = await apiClient.get<Organization>(`/api/platform/organization/${id}`)
  return res.data
}

export const createOrganization = async (data: OrganizationRequest): Promise<Organization> => {
  const res = await apiClient.post<Organization>('/api/platform/organization', data)
  return res.data
}

export const updateOrganization = async (
  id: number,
  data: OrganizationRequest
): Promise<Organization> => {
  const res = await apiClient.put<Organization>(`/api/platform/organization/${id}`, data)
  return res.data
}

export const changeOrganizationStatus = async (
  id: number,
  data: OrganizationStatusRequest
): Promise<Organization> => {
  const res = await apiClient.patch<Organization>(`/api/platform/organization/${id}/status`, data)
  return res.data
}

export const deleteOrganization = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/platform/organization/${id}`)
}

// ── Platform: Tenant Admins ──────────────────────────────────────────────────

export const getTenantAdmin = async (orgId: number): Promise<TenantAdmin> => {
  const res = await apiClient.get<TenantAdmin>(`/api/platform/organization/${orgId}/tenant-admin`)
  return res.data
}

export const createTenantAdmin = async (
  orgId: number,
  data: TenantAdminRequest
): Promise<TenantAdmin> => {
  const res = await apiClient.post<TenantAdmin>(`/api/platform/organization/${orgId}/tenant-admin`, data)
  return res.data
}

export const updateTenantAdmin = async (
  orgId: number,
  data: TenantAdminRequest
): Promise<TenantAdmin> => {
  const res = await apiClient.put<TenantAdmin>(`/api/platform/organization/${orgId}/tenant-admin`, data)
  return res.data
}

export const changeTenantAdminStatus = async (
  orgId: number,
  adminId: number,
  data: TenantAdminStatusRequest
): Promise<TenantAdmin> => {
  const res = await apiClient.patch<TenantAdmin>(
    `/api/platform/organization/${orgId}/tenant-admin/${adminId}/status`,
    data
  )
  return res.data
}

export const deleteTenantAdmin = async (orgId: number): Promise<void> => {
  await apiClient.delete(`/api/platform/organization/${orgId}/tenant-admin`)
}

// ── Tenant: Organization ─────────────────────────────────────────────────────

export const getTenantOrganization = async (): Promise<Organization> => {
  const res = await apiClient.get<Organization>('/api/tenant/organization')
  return res.data
}

export const updateTenantOrganization = async (
  data: TenantOrganizationRequest
): Promise<Organization> => {
  const res = await apiClient.put<Organization>('/api/tenant/organization', data)
  return res.data
}
