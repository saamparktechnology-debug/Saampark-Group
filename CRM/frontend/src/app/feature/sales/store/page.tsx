"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { Eye, ShoppingCart } from "lucide-react"

import { Button } from "@/components/ui/Button"

const MOCK_PRODUCTS = [
  { id: 1, title: "Logo Design", price: "₹8,000", unit: "/PC", description: "Logo design for your brand.", image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=400&h=250" },
  { id: 2, title: "10GB Hosting", price: "₹8,000", unit: "/PC", description: "Cloud Hosting service 10GB Space - Free support...", image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=400&h=250" },
  { id: 3, title: "Art pictures", price: "₹3,200", unit: "/PC", description: "Hand art pictures for your website.", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=400&h=250" },
  { id: 4, title: "Basic Package", price: "₹1,500", unit: "/PC", description: "Starter package for small businesses", image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=400&h=250" },
  { id: 5, title: "Content writing", price: "₹1,200", unit: "/Hour", description: "We write content for different types of websites, apps...", image: "https://images.unsplash.com/photo-1455390582262-044cdead27d8?auto=format&fit=crop&q=80&w=400&h=250" },
  { id: 6, title: "Custom app development", price: "₹80,000", unit: "/PC", description: "App for your business", image: "https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&q=80&w=400&h=250" },
  { id: 7, title: "Domain .com", price: "₹900", unit: "/PC", description: "Get a dot com domain", image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400&h=250" },
  { id: 8, title: "SEO", price: "₹800", unit: "/Hour", description: "SEO for your websites", image: "https://images.unsplash.com/photo-1572177812156-58036aae439c?auto=format&fit=crop&q=80&w=400&h=250" },
  { id: 9, title: "Website Design", price: "₹1,600", unit: "/Hour", description: "Custom UI/UX website design", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400&h=250" },
]

export default function StorePage() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Store</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_PRODUCTS.map((product) => (
          <motion.div 
            key={product.id}
            whileHover={{ y: -4 }}
            className="group bg-surface border border-border rounded-xl overflow-hidden shadow-soft flex flex-col"
          >
            {/* Image Area with Hover Overlay */}
            <div className="relative h-48 w-full bg-surface-hover overflow-hidden">
              <img src={product.image} alt={product.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              
              {/* Glassmorphic Hover Overlay */}
              <div className="absolute inset-0 bg-background/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                <Button variant="primary" leftIcon={<ShoppingCart size={16} />}>
                  Add to cart
                </Button>
                <Button variant="secondary" size="icon" className="bg-surface">
                  <Eye size={16} />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="font-semibold text-foreground truncate">{product.title}</h3>
              <div className="flex items-end gap-1 mt-1 mb-3">
                <span className="text-danger font-medium">{product.price}</span>
                <span className="text-xs text-muted-foreground pb-0.5">{product.unit}</span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-auto">
                {product.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
