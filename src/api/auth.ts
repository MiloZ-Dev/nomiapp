import { api } from "@/api/axios"
import type { LoginCredentials, TokenResponse, User } from "@/types/auth"

export async function login(
  credentials: LoginCredentials
): Promise<TokenResponse> {
  const { data } = await api.post("/auth/login", {
    email: credentials.email,
    password: credentials.password,
  })
  return data.data
}

export async function getMe(): Promise<User> {
  const { data } = await api.get("/auth/me")
  return data.data
}

export async function logout(): Promise<void> {
  try {
    await api.post("/auth/logout")
  } catch {
    /* noop */
  }
}