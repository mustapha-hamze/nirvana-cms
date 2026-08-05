import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from './index'

export type AuthUser = {
  _id: string
  name: string
  email: string
  displayEmail?: string
  role: 'SuperAdmin' | 'WebSiteAdmin' | 'WebSiteContentCreator' | 'WebsiteUser'
  applications: Array<{ _id: string; name: string }>
}

interface AuthState {
  user: AuthUser | null
  token: string | null
}

function loadFromStorage(): AuthState {
  try {
    const token = localStorage.getItem('token')
    const user: AuthUser | null = JSON.parse(localStorage.getItem('user') ?? 'null')

    // Reject stale user objects that predate the role field
    if (user && !user.role) {
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      return { token: null, user: null }
    }

    return { token, user }
  } catch {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    return { token: null, user: null }
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState: loadFromStorage(),
  reducers: {
    loginSuccess(state, action: PayloadAction<{ user: AuthUser; token: string; refreshToken: string }>) {
      state.user = action.payload.user
      state.token = action.payload.token
      localStorage.setItem('token', action.payload.token)
      localStorage.setItem('refreshToken', action.payload.refreshToken)
      localStorage.setItem('user', JSON.stringify(action.payload.user))
    },
    // Updates just the access token — used after a silent /auth/refresh, where
    // the user object hasn't changed and the refresh token is persisted
    // separately (see api/client.ts, which owns the refresh-token rotation).
    setAccessToken(state, action: PayloadAction<string>) {
      state.token = action.payload
      localStorage.setItem('token', action.payload)
    },
    logout(state) {
      state.user = null
      state.token = null
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
    },
  },
})

export const { loginSuccess, setAccessToken, logout } = authSlice.actions

// Selectors — return stable primitives so useSelector never causes spurious re-renders
export const selectUser = (state: RootState) => state.auth.user
export const selectToken = (state: RootState) => state.auth.token
export const selectIsAuthenticated = (state: RootState) => !!(state.auth.token && state.auth.user)
export const selectUserRole = (state: RootState) => state.auth.user?.role ?? null

export default authSlice.reducer
