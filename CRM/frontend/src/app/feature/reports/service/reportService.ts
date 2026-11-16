import { getInvoices } from "../../sales/invoices/service/invoiceService"
import { getPayments } from "../../sales/payments/service/paymentService"
import { getClients } from "../../clients/service/clientService"
import { getLeads } from "../../leads/service/leadService"
import { getSubscriptions } from "../../subscriptions/service/subscriptionService"
import { getProjects } from "../../projects/service/projectService"
import { taskService } from "../../tasks/service/taskService"

export const reportFeatureService = {
  getInvoices,
  getPayments,
  getClients,
  getLeads,
  getSubscriptions,
  getProjects,
  getTasks: taskService.getTasks,
}
