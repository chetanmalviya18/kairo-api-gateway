import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

interface AuthState {
  token: string | null
  role: 'PLATFORM_ADMIN' | 'TENANT_ADMIN' | null
  username: string | null
}

const initialState: AuthState = {
  token: localStorage.getItem('kairo_token'),
  role: localStorage.getItem('kairo_role') as AuthState['role'],
  username: localStorage.getItem('kairo_username'),
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ token: string; role: AuthState['role']; username: string }>
    ) {
      state.token = action.payload.token
      state.role = action.payload.role
      state.username = action.payload.username
      localStorage.setItem('kairo_token', action.payload.token)
      localStorage.setItem('kairo_role', action.payload.role ?? '')
      localStorage.setItem('kairo_username', action.payload.username)
    },
    logout(state) {
      state.token = null
      state.role = null
      state.username = null
      localStorage.removeItem('kairo_token')
      localStorage.removeItem('kairo_role')
      localStorage.removeItem('kairo_username')
    },
  },
})

export const { setCredentials, logout } = authSlice.actions
export default authSlice.reducer

