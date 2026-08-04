"use client"

import * as React from "react"
import { motion } from "framer-motion"

export function DonutChart({ data, size = 120, strokeWidth = 14 }: any) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  let currentOffset = 0

  return (
    <motion.div 
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative flex items-center justify-center" 
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
          className="text-surface-pressed"
        />
        {data.map((item: any, i: number) => {
          const dasharray = `${(item.percent / 100) * circumference} ${circumference}`
          const offset = currentOffset
          currentOffset -= (item.percent / 100) * circumference
          if (item.percent === 0) return null
          return (
            <motion.circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeDasharray={dasharray}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, delay: i * 0.15, ease: "easeOut" }}
              className={item.colorClass}
              strokeLinecap="round"
            />
          )
        })}
      </svg>
    </motion.div>
  )
}
