"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Eye, ShoppingCart, Check, Plus, Package, 
  Sparkles, CheckCircle2, ArrowRight, X, DollarSign, Filter 
} from "lucide-react"
import { Button } from "@/components/ui/Button"
import { useAuthStore } from "@/store/useAuthStore"
import { addOrder } from "@/app/feature/sales/orders/services/orderService"
import { addInvoice } from "@/app/feature/sales/invoices/services/invoiceService"
import { fetchModuleDataFromDB, saveModuleDataToDB } from "@/lib/storageSync"

export interface StoreServiceProduct {
  id: string
  title: string
  category: string
  price: string
  priceNum: number
  unit: string
  image: string
  description: string
  features: string[]
}

const DEFAULT_STORE_PRODUCTS: StoreServiceProduct[] = [
  {
    id: "prod_1",
    title: "Enterprise Cloud ERP System",
    category: "Software Engineering",
    price: "₹1,45,000",
    priceNum: 145000,
    unit: "/ project",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=60",
    description: "Complete ERP solution featuring multi-branch invoicing, client portal, real-time inventory, and analytics.",
    features: ["Custom RBAC Roles", "GST Invoicing & Payments", "Live Real-Time Messenger", "1-Year Cloud Maintenance"]
  },
  {
    id: "prod_2",
    title: "Full-Stack Mobile App (iOS & Android)",
    category: "Mobile Apps",
    price: "₹95,000",
    priceNum: 95000,
    unit: "/ app bundle",
    image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=60",
    description: "High-performance native mobile applications developed with React Native and Node.js REST APIs.",
    features: ["Push Notifications", "Biometric Authentication", "Payment Gateway Integration", "App Store Publishing"]
  },
  {
    id: "prod_3",
    title: "High-Converting UI/UX Design Kit",
    category: "Design & Branding",
    price: "₹35,000",
    priceNum: 35000,
    unit: "/ design system",
    image: "https://images.unsplash.com/photo-1581291518655-9523c932edcf?w=800&auto=format&fit=crop&q=60",
    description: "Figma design systems with component libraries, interactive prototypes, and production-ready design tokens.",
    features: ["Over 80+ Screen Views", "Dark & Light Design Tokens", "Interactive Micro-Interactions", "Developer Hand-off Guide"]
  },
  {
    id: "prod_4",
    title: "AWS / Google Cloud DevOps & CI/CD Setup",
    category: "Cloud Infrastructure",
    price: "₹45,000",
    priceNum: 45000,
    unit: "/ setup",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=60",
    description: "Automated Docker containerization, Kubernetes orchestration, SSL certificates, and 99.9% uptime monitoring.",
    features: ["GitHub Actions Pipeline", "Auto-scaling Load Balancers", "Automated Daily Backups", "WAF Security Firewall"]
  },
]

export default function StorePage() {
  const { user, activeCompanyId } = useAuthStore()
  const targetComp = activeCompanyId || user?.companyId || "tech"

  const [products, setProducts] = React.useState<StoreServiceProduct[]>(DEFAULT_STORE_PRODUCTS)
  const [selectedProduct, setSelectedProduct] = React.useState<StoreServiceProduct | null>(null)
  const [selectedCategory, setSelectedCategory] = React.useState("all")
  const [toastMessage, setToastMessage] = React.useState<string | null>(null)
  const [isOrdering, setIsOrdering] = React.useState(false)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 4000)
  }

  const loadProducts = React.useCallback(() => {
    fetchModuleDataFromDB<StoreServiceProduct[]>("store_products", DEFAULT_STORE_PRODUCTS, targetComp).then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setProducts(data)
      }
    })
  }, [targetComp])

  React.useEffect(() => {
    loadProducts()
    window.addEventListener("storage", loadProducts)
    window.addEventListener("saampark_data_synced", loadProducts)
    window.addEventListener("saampark_company_switched", loadProducts)
    return () => {
      window.removeEventListener("storage", loadProducts)
      window.removeEventListener("saampark_data_synced", loadProducts)
      window.removeEventListener("saampark_company_switched", loadProducts)
    }
  }, [loadProducts])

  const filteredProducts = React.useMemo(() => {
    if (selectedCategory === "all") return products
    return products.filter(p => p.category === selectedCategory)
  }, [products, selectedCategory])

  const handleQuickOrder = async (prod: StoreServiceProduct) => {
    setIsOrdering(true)
    try {
      const clientName = user?.name || "Valued Client"
      const clientEmail = user?.email || "client@saampark.com"
      const invoiceId = `INV #${Math.floor(100 + Math.random() * 900)}`
      const baseAmount = Math.round(prod.priceNum / 1.18)
      const gstAmount = prod.priceNum - baseAmount

      await addOrder({
        client: clientName,
        clientEmail,
        project: prod.title,
        orderDate: new Date().toLocaleDateString("en-GB"),
        deliveryDate: new Date(Date.now() + 30 * 86400000).toLocaleDateString("en-GB"),
        itemsCount: 1,
        totalAmount: prod.price,
        paymentStatus: "Unpaid",
        status: "Processing",
        notes: `Direct Store purchase: ${prod.title}`,
        invoiceId,
        companyId: targetComp,
      }, targetComp)

      await addInvoice({
        id: invoiceId,
        client: clientName,
        clientEmail,
        project: prod.title,
        billDate: new Date().toLocaleDateString("en-GB"),
        dueDate: new Date(Date.now() + 15 * 86400000).toLocaleDateString("en-GB"),
        baseAmount,
        gstRate: 18,
        gstAmount,
        totalInvoiced: prod.price,
        paymentReceived: "₹0",
        due: prod.price,
        status: "Not paid",
        billedBy: "Automated Store Portal",
        companyId: targetComp,
      }, targetComp)

      showToast(`🎉 Order placed for "${prod.title}"! Registered in Orders & Invoices (${invoiceId}).`)
      setSelectedProduct(null)
    } catch (err: any) {
      alert(`Error ordering service: ${err.message}`)
    } finally {
      setIsOrdering(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-[1600px] mx-auto p-4 sm:p-6"
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-[99999] bg-zinc-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-zinc-700"
          >
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Package className="text-blue-600 dark:text-blue-400" size={24} />
            <span>IT Services & Solutions Store</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Browse ready-to-deploy software packages, design systems, and cloud architectures with instant invoicing
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {["all", "Software Engineering", "Mobile Apps", "Design & Branding", "Cloud Infrastructure"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl capitalize whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {cat === "all" ? "All Services" : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <motion.div 
            key={product.id}
            whileHover={{ y: -4 }}
            className="group bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xs hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Image Area */}
              <div className="relative h-44 w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
                <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 text-white backdrop-blur-sm">
                  {product.category}
                </span>
              </div>

              {/* Content */}
              <div className="p-4 space-y-2">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm line-clamp-1">{product.title}</h3>
                
                <div className="flex items-baseline gap-1">
                  <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">{product.price}</span>
                  <span className="text-[11px] text-zinc-400">{product.unit}</span>
                </div>

                <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                  {product.description}
                </p>

                <div className="space-y-1 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                  {product.features?.slice(0, 2).map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-zinc-400 truncate">
                      <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                      <span className="truncate">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 pt-0 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedProduct(product)}
                className="p-2 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl transition-colors"
                title="View Package Details"
              >
                <Eye size={15} />
              </button>

              <button
                type="button"
                onClick={() => handleQuickOrder(product)}
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <ShoppingCart size={13} />
                <span>Instant Order</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── PACKAGE DETAIL & ORDER MODAL ── */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-8"
            >
              <div className="relative h-48 w-full">
                <img src={selectedProduct.image} alt={selectedProduct.title} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                    {selectedProduct.category}
                  </span>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mt-1">{selectedProduct.title}</h3>
                  <div className="text-sm font-extrabold text-blue-600 mt-0.5">{selectedProduct.price} {selectedProduct.unit}</div>
                </div>

                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl">
                  {selectedProduct.description}
                </p>

                <div>
                  <h4 className="font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider text-[10px] mb-2">Package Deliverables</h4>
                  <div className="space-y-1.5">
                    {selectedProduct.features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg">
                        <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                        <span className="font-medium text-zinc-700 dark:text-zinc-300">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setSelectedProduct(null)}
                    className="px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 rounded-lg font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isOrdering}
                    onClick={() => handleQuickOrder(selectedProduct)}
                    className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShoppingCart size={14} />
                    <span>{isOrdering ? "Placing Order..." : "Confirm & Place Order"}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
