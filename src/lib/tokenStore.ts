/**
 * Token storage strategy:
 *  - access token: kept in memory only (module-scoped variable) so it is
 *    never persisted and disappears on full page reload — it is re-obtained
 *    via the refresh token.
 *  - refresh token: persisted in localStorage so the session survives reloads.
 */

const REFRESH_TOKEN_KEY = "nomiapp.refresh_token"

let accessToken: string | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setRefreshToken(token: string | null): void {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
}

export function clearTokens(): void {
  accessToken = null
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}
