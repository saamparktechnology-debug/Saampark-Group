"use client"

import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "glass" | "outline"
  size?: "sm" | "md" | "lg" | "icon"
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  children?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, leftIcon, rightIcon, children, ...props }, ref) => {
    const baseStyles = "relative inline-flex items-center justify-center font-medium overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    
    const variants = {
      primary: "bg-primary text-primary-foreground hover:bg-primary-hover shadow-soft",
      secondary: "bg-surface hover:bg-surface-hover text-foreground border border-border shadow-soft",
      outline: "border border-border bg-transparent hover:bg-surface-hover text-foreground",
      danger: "bg-danger text-danger-foreground hover:bg-danger/90 shadow-soft",
      ghost: "hover:bg-surface-hover text-foreground",
      glass: "liquid-glass-pill text-foreground shadow-float hover:border-primary/40 hover:scale-[1.02] active:scale-[0.98]"
    }
    
    const sizes = {
      sm: "h-8 px-3 text-xs rounded-md",
      md: "h-10 px-4 py-2 text-sm rounded-lg",
      lg: "h-12 px-8 text-base rounded-xl",
      icon: "h-10 w-10 rounded-lg flex items-center justify-center"
    }

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center bg-inherit"
          >
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </motion.div>
        )}
        <span className={cn("flex items-center gap-2", isLoading && "opacity-0")}>
          {leftIcon}
          {children}
          {rightIcon}
        </span>
      </motion.button>
    )
  }
)

Button.displayName = "Button"
