'use client'

import React, { useState } from 'react'
import { DataSourceRow } from './DataSourceRow'
import { DataSource } from '@/types/models/DataSource'
import { getDataSources } from '@/app/dfdaActions'
import { Button } from '@/components/ui/button'
import { ReloadIcon } from '@radix-ui/react-icons'
import { useToast } from '@/components/ui/use-toast'

interface DataSourceListProps {
  userId: string
}

export function DataSourceList({ userId }: DataSourceListProps) {
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  const refreshDataSources = async () => {
    try {
      setIsRefreshing(true)
      const freshDataSources = await getDataSources(
        `${process.env.NEXT_PUBLIC_BASE_URL}/import`,
        userId
      ) as DataSource[]
      setDataSources(freshDataSources)
    } catch (error) {
      console.error('Failed to refresh data sources:', error)
      toast({
        title: "Error refreshing data sources",
        description: "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button 
          onClick={refreshDataSources}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <ReloadIcon className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      <div className="space-y-6">
        {Array.isArray(dataSources) && dataSources.length > 0 ? (
          dataSources.map((source, index) => (
            <DataSourceRow key={index} data={source} />
          ))
        ) : (
          <div className="text-center text-gray-600">
            No data sources available
          </div>
        )}
      </div>
    </div>
  )
} 