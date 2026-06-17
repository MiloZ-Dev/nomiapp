export type IncidentType =
  | 'day_overtime' | 'night_overtime' | 'holiday_overtime'
  | 'bonus' | 'commission' | 'special_allowance'
  | 'paid_vacation' | 'paid_sick_leave'
  | 'unjustified_absence' | 'late_arrival'
  | 'payroll_deduction' | 'garnishment'
  | 'payroll_advance' | 'other_deduction'

export interface Incident {
  id: string
  employee_id: string
  company_id: string
  type: IncidentType
  date: string
  hours: number | null
  days: number | null
  amount: number | null
  description: string | null
  applied: boolean
  payroll_id: string | null
  created_at: string
}

export interface IncidentCreate {
  type: IncidentType
  date: string
  hours?: number
  days?: number
  amount?: number
  description?: string
}

export const INCIDENT_LABELS: Record<IncidentType, string> = {
  day_overtime: 'Hora extra diurna',
  night_overtime: 'Hora extra nocturna',
  holiday_overtime: 'Hora extra festivo',
  bonus: 'Bonificación',
  commission: 'Comisión',
  special_allowance: 'Auxilio especial',
  paid_vacation: 'Vacaciones pagadas',
  paid_sick_leave: 'Incapacidad pagada',
  unjustified_absence: 'Ausencia injustificada',
  late_arrival: 'Llegada tarde',
  payroll_deduction: 'Descuento libranza',
  garnishment: 'Embargo',
  payroll_advance: 'Anticipo nómina',
  other_deduction: 'Otro descuento',
}

export const INCOME_INCIDENTS: IncidentType[] = [
  'day_overtime', 'night_overtime', 'holiday_overtime',
  'bonus', 'commission', 'special_allowance',
  'paid_vacation', 'paid_sick_leave'
]

export const DEDUCTION_INCIDENTS: IncidentType[] = [
  'unjustified_absence', 'late_arrival', 'payroll_deduction',
  'garnishment', 'payroll_advance', 'other_deduction'
]
