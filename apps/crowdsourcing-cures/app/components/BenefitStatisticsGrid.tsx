"use client"

import { useEffect, useState } from 'react'
import { getBenefitStatistics } from '@/app/dfdaActions'
import { SharedStatisticsGrid, Statistic } from './SharedStatisticsGrid'

export default function BenefitStatisticsGrid() {
  const [statistics, setStatistics] = useState<Statistic[]>([])

  useEffect(() => {
    getBenefitStatistics().then(setStatistics)
  }, [])

  return <SharedStatisticsGrid statistics={statistics} />
} 