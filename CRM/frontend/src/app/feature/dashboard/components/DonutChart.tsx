"use client"

import * as React from "react"
import { motion } from "framer-motion"

export function DonutChart({ data, size = 120, strokeWidth = 14 }: any) {
  const radius = Math.max(10, (size - strokeWidth) / 2)
  const circumference = radius * 2 * Math.PI

  const items = Array.isArray(data) ? data.filter(Boolean) : []
  const totalVal = items.reduce((s, it) => s + (Number(it?.value ?? it?.percent ?? 0) || 0), 0)

  let currentOffset = 0

  return (
    <motion.div 
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative flex items-center justify-center shrink-0" 
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-surface-pressed opacity-25"
        />
        {items.map((item: any, i: number) => {
          const itemVal = Number(item?.value ?? item?.percent ?? 0) || 0
          const pct = totalVal > 0 
            ? (item?.percent !== undefined ? Number(item.percent) : (itemVal / totalVal) * 100)
            : 0
          if (pct <= 0) return null

          const strokeLen = (pct / 100) * circumference
          const dasharray = `${strokeLen.toFixed(2)} ${circumference.toFixed(2)}`
          const offset = currentOffset
          currentOffset -= strokeLen

          return (
            <motion.circle
              key={item?.id || item?.label || i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={item?.color || "currentColor"}
              strokeWidth={strokeWidth}
              strokeDasharray={dasharray}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, delay: i * 0.15, ease: "easeOut" }}
              className={item?.colorClass || ""}
              strokeLinecap="round"
            />
          )
        })}
      </svg>
    </motion.div>
  )
}

