import { fetchModuleDataFromDB, saveModuleDataToDB, markGlobalItemDeleted, filterGlobalDeletedItems } from "@/lib/storageSync"

export type OrderStatus = "Pending" | "Processing" | "Completed" | "Cancelled"
export type OrderPaymentStatus = "Paid" | "Partially paid" | "Unpaid"

export interface OrderItem {
  id: string
  orderNumber: string
  client: string
  clientEmail?: string
  project: string
  orderDate: string
  deliveryDate: string
  itemsCount: number
  totalAmount: string
  paymentStatus: OrderPaymentStatus
  status: OrderStatus
  notes?: string
  invoiceId?: string
  lastReminderSent?: string
}

export const getOrders = async (): Promise<OrderItem[]> => {
  const data = await fetchModuleDataFromDB<OrderItem[]>("orders", [])
  return Array.isArray(data) ? filterGlobalDeletedItems(data) : []
}

export const addOrder = async (orderData: Omit<OrderItem, "id" | "orderNumber"> & { id?: string; orderNumber?: string }): Promise<OrderItem> => {
  const current = await getOrders()
  const nextId = orderData.id || `ord_${Date.now()}`
  
  // Calculate next Order number if not provided
  let orderNumber = orderData.orderNumber
  if (!orderNumber) {
    const maxNum = current.reduce((max, o) => {
      const num = parseInt(String(o.orderNumber || "").replace(/[^0-9]/g, "")) || 0
      return Math.max(max, num)
    }, 1080)
    orderNumber = `ORD #${maxNum + 1}`
  }

  const newOrder: OrderItem = {
    ...orderData,
    id: nextId,
    orderNumber,
    itemsCount: orderData.itemsCount || 1,
    paymentStatus: orderData.paymentStatus || "Unpaid",
    status: orderData.status || (orderData.paymentStatus === "Paid" ? "Completed" : "Processing"),
  }

  const updated = [newOrder, ...current.filter(o => o.id !== nextId)]
  await saveModuleDataToDB("orders", updated)
  return newOrder
}

export const updateOrder = async (id: string, updates: Partial<OrderItem>): Promise<OrderItem> => {
  const strId = String(id).toLowerCase().trim()
  const current = await getOrders()
  const idx = current.findIndex(o => String(o.id).toLowerCase().trim() === strId)
  if (idx === -1) throw new Error("Order not found")

  current[idx] = { ...current[idx], ...updates }
  await saveModuleDataToDB("orders", current)
  return { ...current[idx] }
}

export const deleteOrder = async (id: string): Promise<boolean> => {
  const strId = String(id).toLowerCase().trim()
  await markGlobalItemDeleted(strId, "orders")
  const current = await getOrders()
  const filtered = current.filter(o => String(o.id).toLowerCase().trim() !== strId)
  await saveModuleDataToDB("orders", filtered)
  return true
}
