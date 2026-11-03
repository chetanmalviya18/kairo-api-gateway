import apiClient from '@/lib/apiClient'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  role: string
  username: string
}

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const res = await apiClient.post<LoginResponse>('/auth/login', data)
  return res.data
}

