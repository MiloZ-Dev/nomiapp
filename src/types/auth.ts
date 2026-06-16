export type Rol = "super_admin" | "admin_empresa"

export interface User {
  id: string
  email: string
  full_name?: string
  rol: Rol
  empresa_id: string | null
  is_active?: boolean
}

export interface LoginCredentials {
  email: string
  password: string
}

/** Response shape returned by POST /auth/login and POST /auth/refresh. */
export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type?: string
}
