export type EstadoNomina = "borrador" | "cerrada"

export interface NominaDetalle {
  id?: string
  empleado_id: string
  empleado_nombre: string
  total_devengado: number
  total_deducciones: number
  neto: number
}

export interface Nomina {
  id: string
  empresa_id: string
  periodo_inicio: string
  periodo_fin: string
  estado: EstadoNomina
  empleados_procesados: number
  total_devengado: number
  total_deducciones: number
  total_neto: number
  detalles?: NominaDetalle[]
}

export interface GenerarNominaPayload {
  periodo_inicio: string
  periodo_fin: string
}
