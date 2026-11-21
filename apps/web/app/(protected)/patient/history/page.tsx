import Link from 'next/link'
import { redirect } from 'next/navigation'
import { X } from 'lucide-react'
import { CategoryFilter } from '@/components/patient/category-select'
import { HistoryList } from '@/components/patient/history-list'
import { Button } from '@/components/ui/button'
import { withUserTransaction } from '@/lib/db'
import { historyTimezone, loadHistory } from '@/lib/patient/history'
import { listCategories } from '@/lib/patient/variables'
import { getServerUser } from '@/lib/server-auth'

export const metadata = { title: 'History' }

/** QuantiModo's History: the person's measurements, newest first, by category or for one variable (`variableId`). */
export default async function HistoryPage({ searchParams }: { searchParams: Promise<{ category?: string; variableId?: string }> }) {
  const user = await getServerUser()
  if (!user) redirect('/login')
  const { category, variableId } = await searchParams
  const filter = { categoryId: category || undefined, globalVariableId: variableId || undefined }
  const [categories, page, timezone, variable] = await withUserTransaction({ id: user.id }, (tx) =>
    Promise.all([
      listCategories(tx),
      loadHistory(tx, user.id, filter),
      historyTimezone(tx, user.id),
      filter.globalVariableId
        ? tx.global_variables.findFirst({ where: { id: filter.globalVariableId }, select: { name: true } })
        : Promise.resolve(null),
    ]),
  )
  const params = new URLSearchParams(Object.entries({ category, variableId }).filter((entry): entry is [string, string] => Boolean(entry[1])))
  const returnTo = `/patient/history${params.size ? `?${params}` : ''}`
  return (
    <div className="container max-w-4xl space-y-6 pb-28 pt-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">History</h1>
        <p className="text-muted-foreground">Everything you have recorded, newest first.</p>
      </header>
      <div className="flex flex-wrap items-center gap-3">
        {variable ? (
          <div className="flex items-center gap-1 rounded-full border bg-muted/50 py-1 pl-3 pr-1 text-sm">
            Only {variable.name}
            <Button asChild variant="ghost" size="icon" className="h-8 w-8 rounded-full">
              <Link href="/patient/history" aria-label="Show all measurements"><X aria-hidden="true" className="h-4 w-4" /></Link>
            </Button>
          </div>
        ) : (
          <div className="w-full max-w-xs"><CategoryFilter categories={categories} /></div>
        )}
      </div>
      <HistoryList initial={page} filter={filter} timezone={timezone} returnTo={returnTo} />
    </div>
  )
}
