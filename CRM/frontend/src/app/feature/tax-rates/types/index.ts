export interface TaxRate {
  id: string
  name: string
  rate: number
  type: string
  status: string
}

export interface TaxRateFormValues {
  name: string
  rate: number
  type: string
  status: string
}
