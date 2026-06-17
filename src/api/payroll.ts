import { api } from "@/api/axios"
import type { Payroll, GeneratePayrollPayload } from "@/types/payroll"

export async function listPayrolls(companyId: string): Promise<Payroll[]> {
  const { data } = await api.get(`/empresas/${companyId}/nomina/`)
  return data.data
}

export async function getPayroll(companyId: string, payrollId: string): Promise<Payroll> {
  const { data } = await api.get(`/empresas/${companyId}/nomina/${payrollId}`)
  return data.data
}

export async function generatePayroll(
  companyId: string, payload: GeneratePayrollPayload
): Promise<Payroll> {
  const { data } = await api.post(`/empresas/${companyId}/nomina/generar`, payload)
  return data.data
}

export async function closePayroll(
  companyId: string, payrollId: string
): Promise<{ payroll: Payroll; warnings: string[] }> {
  const { data } = await api.post(`/empresas/${companyId}/nomina/${payrollId}/cerrar`)
  return { payroll: data.data, warnings: data.warnings || [] }
}

export async function getPendingPayrolls(companyId: string): Promise<Payroll[]> {
  const { data } = await api.get(`/empresas/${companyId}/nomina/pendientes`)
  return data.data
}
