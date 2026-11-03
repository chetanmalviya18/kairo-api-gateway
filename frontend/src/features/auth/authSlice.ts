import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface AuthState {
  token: string | null
  tokenType: string | null
  role: 'PLATFORM_ADMIN' | 'TENANT_ADMIN' | null
  username: string | null
  organizationId: number | null
}

const initialState: AuthState = {
  token: localStorage.getItem('kairo_token'),
  tokenType: localStorage.getItem('kairo_token_type') ?? 'Bearer',
  role: (localStorage.getItem('kairo_role') as AuthState['role']) || null,
  username: localStorage.getItem('kairo_username'),
  organizationId: localStorage.getItem('kairo_org_id')
    ? Number(localStorage.getItem('kairo_org_id'))
    : null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{
        token: string
        tokenType?: string
        role: AuthState['role']
        username: string
        organizationId?: number | null
      }>
    ) {
      state.token = action.payload.token
      state.tokenType = action.payload.tokenType ?? 'Bearer'
      state.role = action.payload.role
      state.username = action.payload.username
      state.organizationId = action.payload.organizationId ?? null

      localStorage.setItem('kairo_token', action.payload.token)
      localStorage.setItem('kairo_token_type', action.payload.tokenType ?? 'Bearer')
      localStorage.setItem('kairo_role', action.payload.role ?? '')
      localStorage.setItem('kairo_username', action.payload.username)
      if (action.payload.organizationId != null) {
        localStorage.setItem('kairo_org_id', String(action.payload.organizationId))
      } else {
        localStorage.removeItem('kairo_org_id')
      }
    },
    logout(state) {
      state.token = null
      state.tokenType = null
      state.role = null
      state.username = null
      state.organizationId = null

      localStorage.removeItem('kairo_token')
      localStorage.removeItem('kairo_token_type')
      localStorage.removeItem('kairo_role')
      localStorage.removeItem('kairo_username')
      localStorage.removeItem('kairo_org_id')
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer
