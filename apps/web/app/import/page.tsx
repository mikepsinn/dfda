import React from 'react'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from 'next/navigation'
import { DataSourceList } from './components/DataSourceList'

export const dynamic = 'force-dynamic'

export default async function ImportPage() {
  const session = await getServerSession(authOptions)
  if(!session?.user?.id) {
    return redirect('/signin?callbackUrl=/import')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Import Your Data</h1>
      <DataSourceList 
        userId={session?.user?.id}
      />
    </div>
  )
}
