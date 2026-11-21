import { notFound, redirect } from 'next/navigation'
import { MeasurementForm } from '@/components/patient/measurement-form'
import { withUserTransaction } from '@/lib/db'
import { returnPath } from '@/lib/patient/return-to'
import { loadEditableMeasurement } from '@/lib/patient/variables'
import { getServerUser } from '@/lib/server-auth'

export const metadata = { title: 'Edit measurement' }

/** Changes or deletes one of the person's measurements, from History. */
export default async function EditMeasurementPage({ params, searchParams }: {
  params: Promise<{ measurementId: string }>
  searchParams: Promise<{ returnTo?: string }>
}) {
  const user = await getServerUser()
  if (!user) redirect('/login')
  const [{ measurementId }, { returnTo }] = await Promise.all([params, searchParams])
  if (!/^[0-9a-f-]{36}$/i.test(measurementId)) notFound()
  const loaded = await withUserTransaction({ id: user.id }, (tx) => loadEditableMeasurement(tx, user.id, measurementId))
  if (!loaded) notFound()
  return (
    <div className="container max-w-3xl space-y-6 pb-28 pt-8">
      <h1 className="text-3xl font-bold tracking-tight">Edit measurement</h1>
      <MeasurementForm variable={loaded.variable} measurement={loaded.measurement}
        defaultDate={loaded.measurement.date} defaultTime={loaded.measurement.time} returnTo={returnPath(returnTo, '/patient/history')} />
    </div>
  )
}
