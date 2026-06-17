import { createContext } from "react"
import type { LoginCredentials, User } from "@/types/auth"

export interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  /** True during the initial bootstrap (restoring a session from a refresh token). */
  isInitializing: boolean
  /** Logs in and resolves with the authenticated user (for role-based routing). */
  login: (credentials: LoginCredentials) => Promise<User>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

/** Where a user should land after logging in / hitting the app root. */
export function getHomePathForUser(user: User): string {
  if (user.role === "company_admin" && user.company_id) {
    return `/empresa/${user.company_id}`
  }
  return "/dashboard"
}
