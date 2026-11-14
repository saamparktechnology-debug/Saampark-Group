"use client"

import * as React from "react"
import { motion } from "framer-motion"

interface CircularLoaderProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  text?: string
  fullScreen?: boolean
  className?: string
}

export function CircularLoader({
  size = "md",
  text,
  fullScreen = false,
  className = "",
}: CircularLoaderProps) {
  const outerSizeMap = {
    xs: "w-5 h-5 border-[2px]",
    sm: "w-7 h-7 border-[2.5px]",
    md: "w-10 h-10 border-[3px]",
    lg: "w-14 h-14 border-[3.5px]",
    xl: "w-20 h-20 border-4",
  }

  const innerSizeMap = {
    xs: "w-3 h-3 border-[1.5px]",
    sm: "w-4 h-4 border-2",
    md: "w-6 h-6 border-2",
    lg: "w-8 h-8 border-2",
    xl: "w-12 h-12 border-[2.5px]",
  }

  const coreSizeMap = {
    xs: "w-1 h-1",
    sm: "w-1.5 h-1.5",
    md: "w-2.5 h-2.5",
    lg: "w-3.5 h-3.5",
    xl: "w-5 h-5",
  }

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3.5 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Ambient Glow */}
        <div className="absolute w-12 h-12 rounded-full bg-primary/25 blur-lg animate-pulse pointer-events-none" />

        {/* Outer Orbital Rotating Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className={`${outerSizeMap[size]} rounded-full border-primary/20 border-t-primary border-r-teal-400 border-b-indigo-500 shadow-md`}
        />

        {/* Inner Counter-Rotating Ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
          className={`absolute ${innerSizeMap[size]} rounded-full border-dashed border-zinc-400/40 dark:border-zinc-600/40`}
        />

        {/* Center Pulsing Core */}
        <motion.div
          animate={{ scale: [0.8, 1.25, 0.8], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          className={`absolute ${coreSizeMap[size]} rounded-full bg-primary shadow-xs`}
        />
      </div>

      {text && (
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs font-semibold tracking-wide text-foreground/90">
            {text}
          </p>
          <div className="flex items-center gap-1">
            {[0, 0.2, 0.4].map((delay, idx) => (
              <motion.div
                key={idx}
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1, delay, ease: "easeInOut" }}
                className="w-1 h-1 rounded-full bg-primary"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-background/80 backdrop-blur-md min-h-screen w-full pointer-events-none select-none">
        {spinner}
      </div>
    )
  }

  return spinner
}
