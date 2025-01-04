'use client'

import type { Session } from "next-auth"

export function SafeLandingContent({ session: _session }: { session: Session | null }) {
  return (
    <div>
      <h1>Safe Landing Content</h1>
    </div>
  )
} 
