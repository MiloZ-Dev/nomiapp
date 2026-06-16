import { api } from "@/api/axios"
import type { GenerarNominaPayload, Nomina } from "@/types/nomina"

export async function listNominas(empresaId: string): Promise<Nomina[]> {
  const { data } = await api.get(`/empresas/${empresaId}/nomina/`)
  return data.data
}

export async function getNomina(empresaId: string, nominaId: string): Promise<Nomina> {
  const { data } = await api.get(`/empresas/${empresaId}/nomina/${nominaId}`)
  return data.data
}

export async function generarNomina(empresaId: string, payload: GenerarNominaPayload): Promise<Nomina> {
  const { data } = await api.post(`/empresas/${empresaId}/nomina/generar`, payload)
  return data.data
}

export async function cerrarNomina(empresaId: string, nominaId: string): Promise<Nomina> {
  const { data } = await api.post(`/empresas/${empresaId}/nomina/${nominaId}/cerrar`)
  return data.data
}