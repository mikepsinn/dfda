"use client"

import { Button } from "@/components/ui/button"
import type { ReactNode } from "react"

interface ButtonWrapperProps {
  children: ReactNode
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  onClick?: () => void
}

export function ButtonWrapper({
  children,
  variant = "default",
  size = "default",
  className = "",
  onClick,
}: ButtonWrapperProps) {
  return (
    <Button variant={variant} size={size} className={className} onClick={onClick}>
      {children}
    </Button>
  )
}

