export interface BankAccount {
  id: string
  name: string
  bankName: string
  accountNumber: string
  ifscCode: string
  branch?: string
  balance: number
  status: string
}

export interface BankAccountFormValues {
  name: string
  bankName: string
  accountNumber: string
  ifscCode: string
  branch: string
  status: string
}
