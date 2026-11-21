import { DateTime } from 'luxon'
import { notFound, redirect } from 'next/navigation'
import { MeasurementForm } from '@/components/patient/measurement-form'
import { VariableSearch } from '@/components/patient/variable-search'
import { withUserTransaction } from '@/lib/db'
import { returnPath } from '@/lib/patient/return-to'
import { findVariables, listCategories, loadRecordingVariable } from '@/lib/patient/variables'
import { getServerUser } from '@/lib/server-auth'

export const metadata = { title: 'Record a measurement' }

type SearchParams = Promise<{ variableId?: string; category?: string; returnTo?: string }>

/**
 * QuantiModo's "Record a measurement": the variable search, then the form for
 * the chosen variable (`variableId`).
 */
export default async function RecordMeasurementPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getServerUser()
  if (!user) redirect('/login')
  const { variableId, category, returnTo } = await searchParams
  const back = returnPath(returnTo, '/patient/history')

  if (variableId) {
    const variable = await withUserTransaction({ id: user.id }, (tx) => loadRecordingVariable(tx, user.id, variableId))
    if (!variable) notFound()
    const now = DateTime.now().setZone(variable.timezone)
    return (
      <div className="container max-w-3xl space-y-6 pb-28 pt-8">
        <h1 className="text-3xl font-bold tracking-tight">Record a measurement</h1>
        <MeasurementForm variable={variable} defaultDate={now.toISODate()!} defaultTime={now.toFormat('HH:mm')} returnTo={back} />
      </div>
    )
  }

  const categoryId = category || null
  const [categories, results] = await withUserTransaction({ id: user.id }, (tx) =>
    Promise.all([listCategories(tx), findVariables(tx, user.id, { categoryId: categoryId ?? undefined })]),
  )
  const params = new URLSearchParams(returnTo ? { returnTo: back } : {})
  return (
    <div className="container max-w-3xl space-y-6 pb-28 pt-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Record a measurement</h1>
        <p className="text-muted-foreground">Choose what to record.</p>
      </header>
      <VariableSearch categories={categories} initialCategoryId={categoryId} initialResults={results}
        href={`/patient/measurements/new${params.size ? `?${params}` : ''}`} />
    </div>
  )
}
