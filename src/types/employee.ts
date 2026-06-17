export type PaymentFrequency = 'weekly' | 'biweekly' | 'monthly'
export type ContractType = 'fixed_term' | 'indefinite' | 'work_contract'

export interface Contract {
  id: string
  type: ContractType
  base_salary: number
  start_date: string
  end_date: string | null
  eps: string
  afp: string
  arl: string
  compensation_fund: string
  probation_period: boolean
  probation_days: number | null
  work_schedule: string
  weekly_hours: number
  work_location: string | null
  modality: string
  mobility_allowance: number
  food_allowance: number
  other_allowances: number
  notes: string | null
  active: boolean
}

export interface Employee {
  id: string
  company_id: string
  first_name: string
  last_name: string
  middle_name: string | null
  second_last_name: string | null
  id_number: string
  document_type: string
  birth_date: string | null
  gender: string | null
  marital_status: string | null
  nationality: string
  address: string | null
  city: string | null
  department: string | null
  phone: string | null
  email: string | null
  bank: string | null
  account_type: string | null
  account_number: string | null
  employee_code: string | null
  position: string
  area: string | null
  cost_center: string | null
  payment_frequency: PaymentFrequency
  hire_date: string | null
  photo_url: string | null
  contract_url: string | null
  active: boolean
  contract?: Contract
}

export interface EmployeeCreate {
  first_name: string
  last_name: string
  middle_name?: string
  second_last_name?: string
  id_number: string
  document_type?: string
  birth_date?: string
  gender?: string
  marital_status?: string
  nationality?: string
  address?: string
  city?: string
  department?: string
  phone?: string
  email?: string
  bank?: string
  account_type?: string
  account_number?: string
  employee_code?: string
  position: string
  area?: string
  cost_center?: string
  payment_frequency?: PaymentFrequency
  hire_date?: string
}

export interface ContractCreate {
  type: ContractType
  base_salary: number
  start_date: string
  end_date?: string
  eps: string
  afp: string
  arl: string
  compensation_fund: string
  probation_period?: boolean
  probation_days?: number
  work_schedule?: string
  weekly_hours?: number
  work_location?: string
  modality?: string
  mobility_allowance?: number
  food_allowance?: number
  other_allowances?: number
  notes?: string
}
