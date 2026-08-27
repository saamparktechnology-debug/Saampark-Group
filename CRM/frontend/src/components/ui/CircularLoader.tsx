"use client"

import * as React from "react"

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
  const sizeMap = {
    xs: "w-4 h-4 border-2",
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-[3px]",
    lg: "w-12 h-12 border-4",
    xl: "w-16 h-16 border-4",
  }

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center">
        {/* Ambient Glow */}
        <div
          className={`absolute rounded-full bg-primary/20 blur-md ${
            size === "xs" ? "w-4 h-4" : size === "sm" ? "w-6 h-6" : size === "md" ? "w-10 h-10" : "w-16 h-16"
          }`}
        />

        {/* Rotating Circular Spinner */}
        <div
          className={`${sizeMap[size]} rounded-full border-primary/20 border-t-primary border-r-primary/70 animate-spin shadow-sm`}
        />
      </div>

      {text && (
        <p className="text-xs font-semibold tracking-wide text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-xs min-h-screen w-full">
        {spinner}
      </div>
    )
  }

  return spinner
}
