import { notFound, redirect } from 'next/navigation'
import { ReminderForm } from '@/components/patient/reminder-form'
import { VariableSearch } from '@/components/patient/variable-search'
import { withUserTransaction } from '@/lib/db'
import { resolveInstance } from '@/lib/instance/resolve'
import { returnPath } from '@/lib/patient/return-to'
import { loadReminderVariable } from '@/lib/patient/reminders'
import { findVariables, listCategories } from '@/lib/patient/variables'
import { getServerUser } from '@/lib/server-auth'

export const metadata = { title: 'Add a reminder' }

type SearchParams = Promise<{ variableId?: string; category?: string; returnTo?: string }>

/**
 * QuantiModo's "Add a reminder": the variable search, then the reminder form
 * for the chosen variable (`variableId`). A variable that has a reminder
 * already opens its own form.
 */
export default async function AddReminderPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getServerUser()
  if (!user) redirect('/login')
  const { variableId, category, returnTo } = await searchParams
  const fallback = (await resolveInstance()) ? '/patient/reminders' : '/patient/user-variables'
  const back = returnPath(returnTo, fallback)

  if (variableId) {
    const variable = await withUserTransaction({ id: user.id }, (tx) => loadReminderVariable(tx, user.id, { globalVariableId: variableId }))
    if (!variable) notFound()
    if (variable.settings && variable.userVariableId) {
      redirect(`/patient/reminders/${variable.userVariableId}?returnTo=${encodeURIComponent(back)}`)
    }
    return (
      <div className="container max-w-3xl space-y-6 pb-28 pt-8">
        <h1 className="text-3xl font-bold tracking-tight">Add a reminder</h1>
        <ReminderForm variable={variable} returnTo={back} />
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
        <h1 className="text-3xl font-bold tracking-tight">Add a reminder</h1>
        <p className="text-muted-foreground">Choose what to be reminded to track.</p>
      </header>
      <VariableSearch categories={categories} initialCategoryId={categoryId} initialResults={results}
        href={`/patient/reminders/new${params.size ? `?${params}` : ''}`} />
    </div>
  )
}
