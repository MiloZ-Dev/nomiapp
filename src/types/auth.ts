export type Role = 'super_admin' | 'company_admin'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  company_id: string | null
  active: boolean
  created_at: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}
