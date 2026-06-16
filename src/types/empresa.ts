export interface Empresa {
  id: string
  nombre: string
  nit: string
  ciudad: string
  direccion?: string | null
  telefono?: string | null
  activo: boolean
}

export interface EmpresaPayload {
  nombre: string
  nit: string
  ciudad: string
  direccion?: string
  telefono?: string
}

export interface EmpresaCredenciales {
  email: string
  password: string
}

/** Returned when creating an empresa — includes the admin's one-time credentials. */
export interface EmpresaCreatedResponse {
  empresa: Empresa
  credenciales: EmpresaCredenciales
}
