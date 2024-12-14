import React from 'react'
import { getDataSources } from '@/app/dfdaActions'
import { DataSourceRow } from './components/DataSourceRow'
import { DataSource } from '@/types/models/DataSource'

export default async function ImportPage() {
  const dataSources =
   await getDataSources(`${process.env.NEXT_PUBLIC_BASE_URL}/import`) as DataSource[]
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Import Your Data</h1>
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
