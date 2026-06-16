import { api } from "@/api/axios"
import type { Contrato, ContratoPayload, Empleado, EmpleadoPayload } from "@/types/empleado"

export async function listEmpleados(empresaId: string): Promise<Empleado[]> {
  const { data } = await api.get(`/empresas/${empresaId}/empleados/`)
  return data.data
}

export async function getEmpleado(empresaId: string, empleadoId: string): Promise<Empleado> {
  const { data } = await api.get(`/empresas/${empresaId}/empleados/${empleadoId}`)
  return data.data
}

export async function createEmpleado(empresaId: string, payload: EmpleadoPayload): Promise<Empleado> {
  const { data } = await api.post(`/empresas/${empresaId}/empleados/`, payload)
  return data.data
}

export async function updateEmpleado(empresaId: string, empleadoId: string, payload: EmpleadoPayload): Promise<Empleado> {
  const { data } = await api.put(`/empresas/${empresaId}/empleados/${empleadoId}`, payload)
  return data.data
}

export async function upsertContrato(empresaId: string, empleadoId: string, payload: ContratoPayload): Promise<Contrato> {
  const { data } = await api.post(`/empresas/${empresaId}/empleados/${empleadoId}/contrato`, payload)
  return data.data
}