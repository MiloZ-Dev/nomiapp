export type TipoContrato = "termino_fijo" | "indefinido" | "obra_labor"

export const TIPO_CONTRATO_LABEL: Record<TipoContrato, string> = {
  termino_fijo: "Término Fijo",
  indefinido: "Indefinido",
  obra_labor: "Obra Labor",
}

export interface Contrato {
  id?: string
  tipo: TipoContrato
  salario_base: number
  fecha_inicio: string
  fecha_fin?: string | null
  eps: string
  afp: string
  arl: string
  caja_compensacion: string
}

export interface Empleado {
  id: string
  empresa_id: string
  nombre: string
  apellido: string
  cedula: string
  email: string
  telefono?: string | null
  cargo: string
  activo: boolean
  contrato?: Contrato | null
}

export interface EmpleadoPayload {
  nombre: string
  apellido: string
  cedula: string
  email: string
  telefono?: string
  cargo: string
}

export type ContratoPayload = Omit<Contrato, "id">
