"use client"

import { useState, useEffect } from "react"
import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface StarRatingProps {
  rating?: number
  maxRating?: number
  size?: "sm" | "md" | "lg"
  onChange?: (rating: number) => void
  readOnly?: boolean
  className?: string
}

export function StarRating({
  rating = 0,
  maxRating = 5,
  size = "md",
  onChange,
  readOnly = false,
  className,
}: StarRatingProps) {
  const [selectedRating, setSelectedRating] = useState(rating)
  const [hoverRating, setHoverRating] = useState(0)

  useEffect(() => {
    setSelectedRating(rating)
  }, [rating])

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  const handleClick = (index: number) => {
    if (readOnly) return
    const newRating = index + 1
    setSelectedRating(newRating)
    onChange?.(newRating)
  }

  return (
    <div className={cn("flex items-center", className)} onMouseLeave={() => !readOnly && setHoverRating(0)}>
      {[...Array(maxRating)].map((_, index) => {
        const isActive = index < (hoverRating || selectedRating)

        return (
          <Star
            key={index}
            className={cn(
              sizeClasses[size],
              "cursor-pointer transition-colors",
              isActive ? "fill-yellow-400 text-yellow-400" : "fill-none text-gray-300",
              readOnly && "cursor-default",
            )}
            onClick={() => handleClick(index)}
            onMouseEnter={() => !readOnly && setHoverRating(index + 1)}
            data-testid={`star-${index + 1}`}
            aria-label={`${index + 1} star${index !== 0 ? "s" : ""}`}
          />
        )
      })}
    </div>
  )
}

