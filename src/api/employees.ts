import { api } from "@/api/axios"
import type { Employee, EmployeeCreate, ContractCreate } from "@/types/employee"
import type { Incident, IncidentCreate } from "@/types/incident"

export async function listEmployees(companyId: string): Promise<Employee[]> {
  const { data } = await api.get(`/empresas/${companyId}/empleados/`)
  return data.data
}

export async function getEmployee(companyId: string, employeeId: string): Promise<Employee> {
  const { data } = await api.get(`/empresas/${companyId}/empleados/${employeeId}`)
  return data.data
}

export async function createEmployee(companyId: string, payload: EmployeeCreate): Promise<Employee> {
  const { data } = await api.post(`/empresas/${companyId}/empleados/`, payload)
  return data.data
}

export async function updateEmployee(
  companyId: string, employeeId: string, payload: Partial<EmployeeCreate>
): Promise<Employee> {
  const { data } = await api.put(`/empresas/${companyId}/empleados/${employeeId}`, payload)
  return data.data
}

export async function upsertContract(
  companyId: string, employeeId: string, payload: ContractCreate
): Promise<void> {
  await api.post(`/empresas/${companyId}/empleados/${employeeId}/contrato`, payload)
}

// Novedades / Incidents
export async function listIncidents(
  companyId: string, employeeId: string, applied?: boolean
): Promise<Incident[]> {
  const { data } = await api.get(
    `/empresas/${companyId}/empleados/${employeeId}/novedades`,
    { params: { aplicada: applied } }
  )
  return data.data
}

export async function createIncident(
  companyId: string, employeeId: string, payload: IncidentCreate
): Promise<Incident> {
  const { data } = await api.post(
    `/empresas/${companyId}/empleados/${employeeId}/novedades`,
    payload
  )
  return data.data
}

export async function deleteIncident(
  companyId: string, employeeId: string, incidentId: string
): Promise<void> {
  await api.delete(
    `/empresas/${companyId}/empleados/${employeeId}/novedades/${incidentId}`
  )
}

// Upload foto
export async function uploadEmployeePhoto(
  companyId: string, employeeId: string, file: File
): Promise<void> {
  const form = new FormData()
  form.append("file", file)
  await api.post(`/empresas/${companyId}/empleados/${employeeId}/foto`, form, {
    headers: { "Content-Type": "multipart/form-data" }
  })
}

// Extraer datos de contrato PDF con AI
export async function extractContractData(
  companyId: string, file: File
): Promise<{ ai_disponible: boolean; datos: Partial<EmployeeCreate & ContractCreate> }> {
  const form = new FormData()
  form.append("file", file)
  const { data } = await api.post(
    `/empresas/${companyId}/empleados/extraer-contrato`, form,
    { headers: { "Content-Type": "multipart/form-data" } }
  )
  return data.data
}
