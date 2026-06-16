import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios"
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "@/lib/tokenStore"
import type { TokenResponse } from "@/types/auth"

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
})

/**
 * A bare axios instance used only for the refresh call, so the refresh
 * request itself does not go through the interceptors below (which would
 * cause infinite recursion on a failing refresh).
 */
const refreshClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
})

// --- Request interceptor: attach the in-memory access token -----------------
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// --- Response interceptor: refresh on 401 once, queuing concurrent calls -----

type RetriableConfig = AxiosRequestConfig & { _retry?: boolean }

let isRefreshing = false
let pendingQueue: Array<(token: string | null) => void> = []

function flushQueue(token: string | null) {
  pendingQueue.forEach((resolve) => resolve(token))
  pendingQueue = []
}

/** Optional hook invoked when refresh fails and the session is unrecoverable. */
let onSessionExpired: (() => void) | null = null
export function setOnSessionExpired(handler: (() => void) | null) {
  onSessionExpired = handler
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  const { data } = await refreshClient.post<TokenResponse>("/auth/refresh", {
    refresh_token: refreshToken,
  })

  setAccessToken(data.access_token)
  if (data.refresh_token) {
    setRefreshToken(data.refresh_token)
  }
  return data.access_token
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined

    if (
      error.response?.status !== 401 ||
      !original ||
      original._retry ||
      // Never try to refresh the refresh/login endpoints themselves.
      original.url?.includes("/auth/refresh") ||
      original.url?.includes("/auth/login")
    ) {
      return Promise.reject(error)
    }

    original._retry = true

    // If a refresh is already in flight, queue this request until it resolves.
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((token) => {
          if (!token) {
            reject(error)
            return
          }
          original.headers = original.headers ?? {}
          ;(original.headers as Record<string, string>).Authorization =
            `Bearer ${token}`
          resolve(api(original))
        })
      })
    }

    isRefreshing = true
    try {
      const newToken = await refreshAccessToken()
      flushQueue(newToken)
      if (!newToken) {
        clearTokens()
        onSessionExpired?.()
        return Promise.reject(error)
      }
      original.headers = original.headers ?? {}
      ;(original.headers as Record<string, string>).Authorization =
        `Bearer ${newToken}`
      return api(original)
    } catch (refreshError) {
      flushQueue(null)
      clearTokens()
      onSessionExpired?.()
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)
