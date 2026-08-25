export type ClientTabMode = "overview" | "clients" | "contacts";

export interface ClientLabelItem {
  id: string;
  name: string;
  color: string;
}

export interface ClientItem {
  id: string; // e.g. "101"
  name: string;
  primaryContact: string;
  phone: string;
  group: string; // e.g. "VIP", "Silver", "Gold"
  label: string;
  labelColor: string;
  projectsCount: number;
  totalInvoiced: string;
  paymentReceived: string;
  due: string;
  type?: "Organization" | "Person";
  email?: string;
  website?: string;
  status?: string;
  companyId?: string;
  companyName?: string;
  branchId?: string;
  branchName?: string;
  createdAt?: number | string;
}

export type Client = ClientItem;


export interface ContactItem {
  id: string;
  name: string;
  clientName: string;
  jobTitle: string;
  email: string;
  phone: string;
  avatarSeed?: string;
}
