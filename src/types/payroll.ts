export type PayrollStatus = 'draft' | 'closed'

export interface PayrollDetail {
  id: string
  employee_id: string
  employee_name: string
  base_salary: number
  days_worked: number
  overtime_hours: number
  overtime_value: number
  transport_allowance: number
  health_deduction: number
  pension_deduction: number
  total_deductions: number
  total_earned: number
  net_pay: number
  total_overtime_hours: number
  total_bonuses: number
  total_additional_deductions: number
  manually_edited: boolean
}

export interface Payroll {
  id: string
  company_id: string
  period_start: string
  period_end: string
  status: PayrollStatus
  total_earned: number
  total_deductions: number
  total_net: number
  created_at: string
  details?: PayrollDetail[]
}

export interface GeneratePayrollPayload {
  period_start: string
  period_end: string
}
