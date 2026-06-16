import { api } from "@/api/axios"
import type {
  Empresa,
  EmpresaCreatedResponse,
  EmpresaPayload,
} from "@/types/empresa"

export async function listEmpresas(): Promise<Empresa[]> {
  const { data } = await api.get("/empresas/")
  return data.data
}

export async function getEmpresa(id: string): Promise<Empresa> {
  const { data } = await api.get(`/empresas/${id}`)
  return data.data
}

export async function createEmpresa(
  payload: EmpresaPayload
): Promise<EmpresaCreatedResponse> {
  const { data } = await api.post("/empresas/", payload)
  return data.data
}

export async function updateEmpresa(
  id: string,
  payload: EmpresaPayload
): Promise<Empresa> {
  const { data } = await api.put(`/empresas/${id}`, payload)
  return data.data
}

export async function deleteEmpresa(id: string): Promise<void> {
  await api.delete(`/empresas/${id}`)
}