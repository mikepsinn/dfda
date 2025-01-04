'use client'

import { ExtendedUser } from "@/types/auth"
import { LoginPromptButton } from "@/components/LoginPromptButton"
import Image from 'next/image'

interface SafeLandingContentProps {
  session?: ExtendedUser | null
}

export function SafeLandingContent({ session }: SafeLandingContentProps) {
  return (
    <div>
      <h1>Safe Landing Content</h1>
    </div>
  )
} 
