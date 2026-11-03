"use client"

import * as React from "react"
import { motion } from "framer-motion"

interface ThreeDotLoaderProps {
  text?: string
  fullScreen?: boolean
}

export function ThreeDotLoader({ text = "Loading data...", fullScreen = false }: ThreeDotLoaderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${
        fullScreen ? "fixed inset-0 z-50 bg-background/85 backdrop-blur-xs min-h-screen w-full pointer-events-none select-none" : "py-16 w-full"
      }`}
    >
      <div className="relative flex items-center justify-center">
        {/* Outer ambient glow */}
        <div className="absolute w-12 h-12 rounded-full bg-primary/20 blur-lg animate-pulse" />

        {/* Outer rotating gradient ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 rounded-full border-[3px] border-primary/20 border-t-primary border-r-teal-400 border-b-indigo-500 shadow-md"
        />

        {/* Inner reverse rotating ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
          className="absolute w-6 h-6 rounded-full border-2 border-dashed border-zinc-400/40 dark:border-zinc-600/40"
        />

        {/* Center pulsing core dot */}
        <motion.div
          animate={{ scale: [0.8, 1.25, 0.8], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-2.5 h-2.5 rounded-full bg-primary shadow-xs"
        />
      </div>

      {text && (
        <div className="flex flex-col items-center gap-1.5">
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
}
