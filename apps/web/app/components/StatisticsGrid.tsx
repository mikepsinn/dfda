"use client"

import { useState, useEffect } from 'react'
import { FullScreenModal } from './FullScreenModal'
import { getStatistics } from '@/app/dfdaActions'
import { NeoBrutalistBox } from './NeoBrutalistBox'

interface Statistic {
  emoji: string
  number: string
  textFollowingNumber: string
  content: string
}

export default function StatisticsGrid() {
  const [selectedStat, setSelectedStat] = useState<Statistic | null>(null)
  const [statistics, setStatistics] = useState<Statistic[]>([])

  useEffect(() => {
    getStatistics().then(setStatistics)
  }, [])

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statistics.map((stat, index) => (
          <NeoBrutalistBox 
            key={index}
            onClick={() => setSelectedStat(stat)}
            className="flex flex-col items-center justify-center text-center space-y-2"
          >
            <div className="text-4xl mb-2">{stat.emoji}</div>
            <div className="text-4xl font-bold">{stat.number}</div>
            <div className="text-lg text-gray-600">{stat.textFollowingNumber}</div>
          </NeoBrutalistBox>
        ))}
      </div>

      {selectedStat && (
        <FullScreenModal
          content={selectedStat.content}
          onClose={() => setSelectedStat(null)}
        />
      )}
    </>
  )
} 