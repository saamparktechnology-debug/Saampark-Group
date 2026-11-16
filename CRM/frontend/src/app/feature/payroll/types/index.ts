export interface PayrollItem {
  id: string
  employee: string
  employeeId?: string
  projectId?: string
  projectName?: string
  month: string
  basic: number
  allowances: number
  deductions: number
  net: number
  status: string
}
