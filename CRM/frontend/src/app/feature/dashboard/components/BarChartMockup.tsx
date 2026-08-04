"use client"

import * as React from "react"
import { motion } from "framer-motion"

const STATIC_HEIGHTS = [
  30, 45, 25, 60, 80, 40, 95, 30, 70, 85, 
  40, 60, 75, 50, 90, 65, 45, 80, 55, 70, 
  85, 40, 60, 95, 30, 85, 60, 75, 50, 90
]

export function BarChartMockup({ count = 30, color = "bg-emerald-500" }) {
  return (
    <div className="flex items-end gap-1 h-20 w-full px-2">
      {STATIC_HEIGHTS.slice(0, count).map((h, i) => (
        <motion.div 
          key={i} 
          initial={{ height: 0 }}
          animate={{ height: `${h}%` }}
          transition={{ duration: 0.6, delay: i * 0.02, ease: "easeOut" }}
          className={`flex-1 ${color} rounded-t-sm`} 
          style={{ opacity: 0.8 }} 
        />
      ))}
    </div>
  )
}
