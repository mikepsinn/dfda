"use client"

import React from 'react'
import { DataSourceButton, ButtonIcon } from './DataSourceButton'
import Image from 'next/image'
import { DataSource } from '@/types/models/DataSource'
import { Button } from '@/types/models/Button'


interface Props {
  data: DataSource
}

function updateDataSourceButtonLink(button: Button): void {
  if (!button.link) {
    return
  }
  try {
    const url = new URL(button.link)
    url.searchParams.set('clientId', process.env.NEXT_PUBLIC_DFDA_CLIENT_ID || 'quantimodo')
    url.searchParams.set('final_callback_url', window.location.href)
    button.link = url.href
  } catch (error) {
    console.error(error)
    throw error
  }
}

export const DataSourceRow = ({ data }: Props): React.ReactElement => (
  <div className="p-6 border rounded-lg mb-4">
    <div className="flex items-center gap-4 mb-4">
      {data.image && (
        <div className="w-12 h-12 relative">
          <Image
            src={data.image}
            alt={data.name}
            fill
            className="object-contain"
          />
        </div>
      )}
      <div>
        <h2 className="text-2xl font-semibold">{data.displayName || data.name}</h2>
        {data.connected && (
          <span className="text-green-500 text-sm">Connected</span>
        )}
      </div>
    </div>
    <p className="text-gray-600 mb-4">
      {data.longDescription || data.shortDescription}
    </p>
    <div className="flex flex-wrap gap-3">
      {data.buttons?.map((button, index) => {
        updateDataSourceButtonLink(button)
        return (
          <DataSourceButton key={index} bgColor={button.color} href={button.link}>
            <ButtonIcon src={button.image || ''} />
            {button.text}
          </DataSourceButton>
        )
      })}
      {data.getItUrl && !data.buttons?.length && (
        <DataSourceButton href={data.getItUrl} bgColor="#4A5568">
          {data.image && <ButtonIcon src={data.image} />}
          {data.connected ? 'Reconnect' : 'Connect'}
        </DataSourceButton>
      )}
    </div>
  </div>
) 