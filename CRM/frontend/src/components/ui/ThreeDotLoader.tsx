"use client"

import * as React from "react"
import { motion } from "framer-motion"

interface ThreeDotLoaderProps {
  text?: string
  fullScreen?: boolean
}

export function ThreeDotLoader({ text = "Loading page...", fullScreen = true }: ThreeDotLoaderProps) {
  const dotVariants = {
    initial: { y: 0, opacity: 0.4 },
    animate: { y: -10, opacity: 1 },
  }

  const containerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.15,
        repeat: Infinity,
        repeatType: "reverse" as const,
      },
    },
  }

  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${
        fullScreen ? "fixed inset-0 z-50 bg-background/80 backdrop-blur-xs min-h-screen w-full" : "py-16 w-full"
      }`}
    >
      <motion.div
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="flex items-center gap-2.5"
      >
        <motion.span
          variants={dotVariants}
          transition={{ duration: 0.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
          className="w-3.5 h-3.5 rounded-full bg-primary shadow-sm"
        />
        <motion.span
          variants={dotVariants}
          transition={{ duration: 0.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.15 }}
          className="w-3.5 h-3.5 rounded-full bg-primary/80 shadow-sm"
        />
        <motion.span
          variants={dotVariants}
          transition={{ duration: 0.4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut", delay: 0.3 }}
          className="w-3.5 h-3.5 rounded-full bg-primary/60 shadow-sm"
        />
      </motion.div>

      {text && (
        <p className="text-xs font-semibold tracking-wide text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  )
}
