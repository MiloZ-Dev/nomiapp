import { api } from "@/api/axios"
import type { Company, CompanyCreate, CompanyCreatedResponse } from "@/types/company"

export async function listCompanies(): Promise<Company[]> {
  const { data } = await api.get("/empresas/")
  return data.data
}

export async function getCompany(id: string): Promise<Company> {
  const { data } = await api.get(`/empresas/${id}`)
  return data.data
}

export async function createCompany(payload: CompanyCreate): Promise<CompanyCreatedResponse> {
  const { data } = await api.post("/empresas/", payload)
  return data.data
}

export async function updateCompany(id: string, payload: Partial<CompanyCreate>): Promise<Company> {
  const { data } = await api.put(`/empresas/${id}`, payload)
  return data.data
}

export async function uploadCompanyLogo(id: string, file: File): Promise<Company> {
  const form = new FormData()
  form.append("file", file)
  const { data } = await api.post(`/empresas/${id}/logo`, form, {
    headers: { "Content-Type": "multipart/form-data" }
  })
  return data.data
}
