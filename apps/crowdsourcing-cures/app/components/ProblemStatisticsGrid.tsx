"use client"

import { useEffect, useState } from 'react'
import { getProblemStatistics } from '@/app/dfdaActions'
import { SharedStatisticsGrid, Statistic } from './SharedStatisticsGrid'

export default function ProblemStatisticsGrid() {
  const [statistics, setStatistics] = useState<Statistic[]>([])

  useEffect(() => {
    getProblemStatistics().then(setStatistics)
  }, [])

  return <SharedStatisticsGrid statistics={statistics} />
} 