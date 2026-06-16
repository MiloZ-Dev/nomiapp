import { useCallback, useEffect, useState } from "react"
import * as authApi from "@/api/auth"
import { setOnSessionExpired } from "@/api/axios"
import {
  clearTokens,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "@/lib/tokenStore"
import type { LoginCredentials, User } from "@/types/auth"
import { AuthContext, type AuthContextValue } from "./auth-context"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  const clearSession = useCallback(() => {
    clearTokens()
    setUser(null)
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const tokens = await authApi.login(credentials)
    setAccessToken(tokens.access_token)
    setRefreshToken(tokens.refresh_token)
    const me = await authApi.getMe()
    setUser(me)
    // Returned so the caller (LoginPage) can redirect based on the user's role
    // — navigation can't happen here since AuthProvider sits outside the Router.
    return me
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    clearSession()
  }, [clearSession])

  // Register the global session-expired handler so a failed token refresh
  // (triggered from the axios interceptor) logs the user out in the UI.
  useEffect(() => {
    setOnSessionExpired(clearSession)
    return () => setOnSessionExpired(null)
  }, [clearSession])

  // Bootstrap: if a refresh token exists, try to restore the session.
  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      if (!getRefreshToken()) {
        setIsInitializing(false)
        return
      }
      try {
        // getMe() triggers a 401 -> refresh -> retry via the interceptor,
        // which mints a fresh in-memory access token.
        const me = await authApi.getMe()
        if (!cancelled) setUser(me)
      } catch {
        if (!cancelled) clearSession()
      } finally {
        if (!cancelled) setIsInitializing(false)
      }
    }

    bootstrap()
    return () => {
      cancelled = true
    }
  }, [clearSession])

  const value: AuthContextValue = {
    user,
    isAuthenticated: !!user,
    isInitializing,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
