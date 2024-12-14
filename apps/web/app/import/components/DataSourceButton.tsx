"use client"

import React from 'react'
import Image from 'next/image'
import { cn } from "@/lib/utils"

interface DataSourceButtonProps {
  bgColor?: string
  href: string
  children: React.ReactNode
}

export const DataSourceButton = ({ 
  bgColor = '#4A5568', 
  href, 
  children 
}: DataSourceButtonProps) => {
  return (
    <a
      href={href}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-md text-white transition-all',
        'hover:opacity-90'
      )}
      style={{ backgroundColor: bgColor }}
    >
      {children}
    </a>
  )
}

export const ButtonIcon = ({ src }: { src: string }) => {
  return (
    <div className="w-5 h-5 relative">
      <Image
        src={src}
        alt="Icon"
        fill
        className="object-contain"
      />
    </div>
  )
} 