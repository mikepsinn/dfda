'use client'

import React from 'react'
import ClinicalTrialConditionSearchAutocomplete from './ClinicalTrialConditionSearchAutocomplete'
import { useRouter } from 'next/navigation'

export default function ConditionSearchSection() {
  const router = useRouter()

  return (
    <div className="max-w-xl mb-8">
      <ClinicalTrialConditionSearchAutocomplete
        onConditionSelect={(condition) => {
          router.push(`/conditions/${condition}`)
        }}
        placeholder="Search for a condition..."
      />
    </div>
  )
} 