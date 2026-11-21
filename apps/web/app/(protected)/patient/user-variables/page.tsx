import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus } from 'lucide-react'
import { CategoryFilter } from '@/components/patient/category-select'
import { MyVariables } from '@/components/patient/my-variables'
import { Button } from '@/components/ui/button'
import { withUserTransaction } from '@/lib/db'
import { loadMyVariables } from '@/lib/patient/reminders'
import { listCategories } from '@/lib/patient/variables'
import { getServerUser } from '@/lib/server-auth'

export const metadata = { title: 'My variables' }

/** QuantiModo's My Variables: the person's variables by category, under As-needed, Scheduled and Archived. */
export default async function MyVariablesPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const user = await getServerUser()
  if (!user) redirect('/login')
  const { category } = await searchParams
  const [categories, variables] = await withUserTransaction({ id: user.id }, (tx) =>
    Promise.all([listCategories(tx), loadMyVariables(tx, user.id, { categoryId: category || undefined })]),
  )
  return (
    <div className="container max-w-4xl space-y-6 pb-28 pt-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">My variables</h1>
          <p className="text-muted-foreground">Your reminders and favorites.</p>
        </div>
        <Button asChild className="gap-1.5">
          <Link href="/patient/reminders/new?returnTo=%2Fpatient%2Fuser-variables"><Plus aria-hidden="true" className="h-4 w-4" />Add a reminder</Link>
        </Button>
      </header>
      <div className="max-w-xs">
        <CategoryFilter categories={categories} />
      </div>
      <MyVariables variables={variables} filtered={Boolean(category)} />
    </div>
  )
}
