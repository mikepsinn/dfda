import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { Bell, History, PencilLine } from 'lucide-react'
import { VariableCharts } from '@/components/patient/variable-charts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { withUserTransaction } from '@/lib/db'
import { valueText } from '@/lib/patient/value-text'
import { loadVariablePage, rangeOf, RANGES, type VariablePageData } from '@/lib/patient/variable-page'
import { getServerUser } from '@/lib/server-auth'
import { cn } from '@/lib/utils'

export const metadata = { title: 'Variable' }

function when(iso: string | null, zone: string) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('en-US', { timeZone: zone, month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso))
}

/** The daily rules in words, so the charts say how their values were made. */
function rulesText(data: VariablePageData) {
  const day = data.rules.combination === 'SUM' ? "Each day's value is the sum of its measurements" : "Each day's value is the average of its measurements"
  return `${day}${data.rules.fillingType === 'zero' ? ', and a day without one counts as zero' : ''}.`
}

function Statistics({ data }: { data: VariablePageData }) {
  const { stats } = data
  if (!stats) return null
  const shown = (value: number) => valueText(value, data.unit)
  const items: [string, string][] = [
    ['Measurements', String(data.measurementCount)],
    ['Days with a value', String(stats.days)],
    ['Average daily value', shown(stats.mean)],
    ['Median', shown(stats.median)],
    ['Most common', shown(stats.mostCommon)],
    ['Lowest', shown(stats.minimum)],
    ['Highest', shown(stats.maximum)],
    ['Standard deviation', String(stats.standardDeviation)],
    ['First recorded', when(data.allTime.firstAt, data.timezone)],
    ['Last recorded', when(data.allTime.latestAt, data.timezone)],
  ]
  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-lg font-semibold">Statistics</h2>
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

/**
 * QuantiModo's variable page: the person's daily values of one variable in a
 * chosen period, with statistics and charts, and buttons to record, change the
 * reminder and see the history. The route takes the person's variable id, or
 * the variable's own id (for example energy-level).
 */
export default async function VariablePage({ params, searchParams }: {
  params: Promise<{ userVariableId: string }>
  searchParams: Promise<{ range?: string }>
}) {
  const user = await getServerUser()
  if (!user) redirect('/login')
  const [{ userVariableId }, { range }] = await Promise.all([params, searchParams])
  const ref = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userVariableId)
    ? { userVariableId }
    : { globalVariableId: decodeURIComponent(userVariableId) }
  const data = await withUserTransaction({ id: user.id }, (tx) => loadVariablePage(tx, user.id, ref, rangeOf(range)))
  if (!data) notFound()
  const base = `/patient/user-variables/${data.userVariableId}`
  const back = encodeURIComponent(`${base}${range ? `?range=${data.range}` : ''}`)

  return (
    <div className="container max-w-5xl space-y-6 pb-28 pt-8">
      <header className="flex items-center gap-3">
        <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-2xl">
          {data.emoji ?? data.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0">
          <h1 className="break-words text-3xl font-bold tracking-tight">{data.name}</h1>
          <p className="text-muted-foreground">{data.category}</p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button asChild className="gap-1.5">
          <Link href={`/patient/measurements/new?variableId=${encodeURIComponent(data.globalVariableId)}&returnTo=${back}`}>
            <PencilLine aria-hidden="true" className="h-4 w-4" />Record a measurement
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-1.5">
          <Link href={`/patient/reminders/${data.userVariableId}?returnTo=${back}`}>
            <Bell aria-hidden="true" className="h-4 w-4" />{data.hasReminder ? 'Edit reminder' : 'Add a reminder'}
          </Link>
        </Button>
        <Button asChild variant="outline" className="gap-1.5">
          <Link href={`/patient/history?variableId=${encodeURIComponent(data.globalVariableId)}`}><History aria-hidden="true" className="h-4 w-4" />History</Link>
        </Button>
      </div>

      <nav aria-label="Period" className="inline-flex flex-wrap rounded-lg border p-1">
        {RANGES.map((option) => (
          <Link key={option.id} href={`${base}?range=${option.id}`} aria-current={option.id === data.range ? 'page' : undefined}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              option.id === data.range ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}>
            {option.label}
          </Link>
        ))}
      </nav>

      {data.daily.length === 0 ? (
        <Card className="space-y-4 p-6 text-center">
          <p className="text-muted-foreground">
            {data.allTime.count === 0 ? `You have not recorded ${data.name} yet.` : `No measurements of ${data.name} in this period.`}
          </p>
          <div>
            <Button asChild className="gap-1.5">
              <Link href={`/patient/measurements/new?variableId=${encodeURIComponent(data.globalVariableId)}&returnTo=${back}`}>
                <PencilLine aria-hidden="true" className="h-4 w-4" />Record a measurement
              </Link>
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <Statistics data={data} />
          <p className="text-sm text-muted-foreground">{rulesText(data)}</p>
          <VariableCharts name={data.name} unit={data.unit} daily={data.daily} distribution={data.distribution} weekdays={data.weekdays} />
        </>
      )}
    </div>
  )
}
