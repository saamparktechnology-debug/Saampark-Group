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
  companyId?: string
  branchId?: string
}

export const getOrders = async (companyId?: string): Promise<OrderItem[]> => {
  let targetComp = companyId
  if (!targetComp && typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      targetComp = useAuthStore.getState().activeCompanyId || undefined
    } catch {}
  }

  if (!targetComp || targetComp === "all") {
    const knownCompanies = ["all", "tech", "infotech", "fashion", "digital", "consultancy", "jewellers"]
    const results = await Promise.all(
      knownCompanies.map(c => fetchModuleDataFromDB<OrderItem[]>("orders", [], c).catch(() => []))
    )
    const map = new Map<string, OrderItem>()
    for (const o of results.flat()) {
      if (o && o.id) map.set(String(o.id).toLowerCase().trim(), o)
    }
    return filterGlobalDeletedItems(Array.from(map.values()))
  }

  const scopedData = await fetchModuleDataFromDB<OrderItem[]>("orders", [], targetComp)
  const allMaster = await fetchModuleDataFromDB<OrderItem[]>("orders", [], "all").catch(() => [])

  const map = new Map<string, OrderItem>()
  const targetNorm = targetComp.toLowerCase().trim()

  for (const o of (Array.isArray(allMaster) ? allMaster : [])) {
    if (o && o.id) {
      const oComp = (o.companyId || (o as any).company || "tech").toLowerCase().trim()
      if (oComp === targetNorm || (targetNorm === "tech" && !o.companyId)) {
        map.set(String(o.id).toLowerCase().trim(), o)
      }
    }
  }
  for (const o of (Array.isArray(scopedData) ? scopedData : [])) {
    if (o && o.id) {
      const oComp = (o.companyId || (o as any).company || targetComp).toLowerCase().trim()
      if (oComp === targetNorm || (targetNorm === "tech" && !o.companyId) || !o.companyId) {
        map.set(String(o.id).toLowerCase().trim(), o)
      }
    }
  }

  return filterGlobalDeletedItems(Array.from(map.values()))
}

export const addOrder = async (orderData: Omit<OrderItem, "id" | "orderNumber"> & { id?: string; orderNumber?: string }, companyId?: string): Promise<OrderItem> => {
  let targetComp = companyId
  if (!targetComp && typeof window !== "undefined") {
    try {
      const { useAuthStore } = require("@/store/useAuthStore")
      targetComp = useAuthStore.getState().activeCompanyId || undefined
    } catch {}
  }
  const effectiveComp = (!targetComp || targetComp === "all") ? "tech" : targetComp

  const currentScoped = await getOrders(effectiveComp)
  const currentAll = await getOrders("all")
  const nextId = orderData.id || `ord_${Date.now()}`
  
  let orderNumber = orderData.orderNumber
  if (!orderNumber) {
    const maxNum = [...currentScoped, ...currentAll].reduce((max, o) => {
      const num = parseInt(String(o.orderNumber || "").replace(/[^0-9]/g, "")) || 0
      return Math.max(max, num)
    }, 1080)
    orderNumber = `ORD #${maxNum + 1}`
  }

  const newOrder: OrderItem = {
    ...orderData,
    id: nextId,
    companyId: effectiveComp,
    orderNumber,
    itemsCount: orderData.itemsCount || 1,
    paymentStatus: orderData.paymentStatus || "Unpaid",
    status: orderData.status || (orderData.paymentStatus === "Paid" ? "Completed" : "Processing"),
  }

  const updatedScoped = [newOrder, ...currentScoped.filter(o => String(o.id).toLowerCase().trim() !== nextId.toLowerCase().trim())]
  await saveModuleDataToDB("orders", updatedScoped, effectiveComp)

  const updatedAll = [newOrder, ...currentAll.filter(o => String(o.id).toLowerCase().trim() !== nextId.toLowerCase().trim())]
  await saveModuleDataToDB("orders", updatedAll, "all")

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("storage"))
    window.dispatchEvent(new CustomEvent("saampark_data_synced"))
    window.dispatchEvent(new CustomEvent("saampark_orders_updated"))
  }

  return newOrder
}

export const updateOrder = async (id: string, updates: Partial<OrderItem>, companyId?: string): Promise<OrderItem> => {
  const strId = String(id).toLowerCase().trim()
  const current = await getOrders(companyId)
  const idx = current.findIndex(o => String(o.id).toLowerCase().trim() === strId)
  if (idx === -1) throw new Error("Order not found")

  current[idx] = { ...current[idx], ...updates }
  await saveModuleDataToDB("orders", current, companyId)
  return { ...current[idx] }
}

export const deleteOrder = async (id: string, companyId?: string): Promise<boolean> => {
  const strId = String(id).toLowerCase().trim()
  await markGlobalItemDeleted(strId, "orders")
  const current = await getOrders(companyId)
  const filtered = current.filter(o => String(o.id).toLowerCase().trim() !== strId)
  await saveModuleDataToDB("orders", filtered, companyId)
  return true
}
