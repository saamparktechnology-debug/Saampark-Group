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
  owner?: string;
  managers?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  vatNumber?: string;
  gstNumber?: string;
  currency?: string;
  disableOnlinePayment?: boolean;
  email?: string;
  website?: string;
  status?: string;
  companyId?: string;
  companyName?: string;
  branchId?: string;
  branchName?: string;
  createdAt?: number | string;
  createdBy?: string;
  createdById?: string;
  createdByName?: string;
  createdByEmail?: string;
  createdByRole?: string;
  isClientPrivate?: boolean;
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
