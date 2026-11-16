export interface Employee {
  id: string
  code: string
  name: string
  department: string
  designation: string
  email: string
  phone: string
  status: string
}

export interface DepartmentOption {
  id: string
  name: string
}

export interface EmployeeFormValues {
  code: string
  name: string
  department: string
  designation: string
  email: string
  phone: string
  status: string
}
