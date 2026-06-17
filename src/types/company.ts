export type PayrollFrequency = 'weekly' | 'biweekly' | 'monthly'

export interface Company {
  id: string
  name: string
  nit: string
  legal_name: string | null
  trade_name: string | null
  document_type: string
  verification_digit: string | null
  city: string | null
  department: string | null
  country: string
  postal_code: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  legal_representative: string | null
  economic_activity: string | null
  activity_description: string | null
  company_type: string | null
  tax_regime: string | null
  vat_responsible: boolean
  payroll_frequency: PayrollFrequency
  payment_day: number | null
  logo_url: string | null
  active: boolean
  created_at: string
}

export interface CompanyCredentials {
  email: string
  password: string
}

export interface CompanyCreatedResponse {
  empresa: Company
  credenciales: CompanyCredentials
}

export interface CompanyCreate {
  name: string
  nit: string
  legal_name?: string
  trade_name?: string
  document_type?: string
  verification_digit?: string
  city?: string
  department?: string
  country?: string
  postal_code?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  legal_representative?: string
  economic_activity?: string
  activity_description?: string
  company_type?: string
  tax_regime?: string
  vat_responsible?: boolean
  payroll_frequency?: PayrollFrequency
  payment_day?: number
}
