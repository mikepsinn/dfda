import { notFound, redirect } from 'next/navigation'
import { ReminderForm } from '@/components/patient/reminder-form'
import { withUserTransaction } from '@/lib/db'
import { resolveInstance } from '@/lib/instance/resolve'
import { returnPath } from '@/lib/patient/return-to'
import { loadReminderVariable } from '@/lib/patient/reminders'
import { getServerUser } from '@/lib/server-auth'

export const metadata = { title: 'Edit reminder' }

/** QuantiModo's reminder form for one of the person's variables. */
export default async function EditReminderPage({ params, searchParams }: {
  params: Promise<{ userVariableId: string }>
  searchParams: Promise<{ returnTo?: string }>
}) {
  const user = await getServerUser()
  if (!user) redirect('/login')
  const [{ userVariableId }, { returnTo }] = await Promise.all([params, searchParams])
  if (!/^[0-9a-f-]{36}$/i.test(userVariableId)) notFound()
  const variable = await withUserTransaction({ id: user.id }, (tx) => loadReminderVariable(tx, user.id, { userVariableId }))
  if (!variable) notFound()
  // A company's site has the reminders page but not My Variables (lib/instance/routes.ts).
  const fallback = (await resolveInstance()) ? '/patient/reminders' : '/patient/user-variables'
  return (
    <div className="container max-w-3xl space-y-6 pb-28 pt-8">
      <h1 className="text-3xl font-bold tracking-tight">{variable.settings ? 'Edit reminder' : 'Add a reminder'}</h1>
      <ReminderForm variable={variable} returnTo={returnPath(returnTo, fallback)} />
    </div>
  )
}
