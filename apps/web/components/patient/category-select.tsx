'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { VariableCategory } from '@/lib/patient/variables'

const ALL = 'all'

/** QuantiModo's category filter: every category, or one. */
export function CategorySelect({ categories, value, onChange }: {
  categories: VariableCategory[]
  value: string | null
  onChange: (categoryId: string | null) => void
}) {
  return (
    <Select value={value ?? ALL} onValueChange={(next) => onChange(next === ALL ? null : next)}>
      <SelectTrigger aria-label="Category" className="h-11">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All categories</SelectItem>
        {categories.map((category) => (
          <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** The category filter of a page, kept in its `category` search parameter. */
export function CategoryFilter({ categories }: { categories: VariableCategory[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  return (
    <CategorySelect
      categories={categories}
      value={searchParams.get('category')}
      onChange={(categoryId) => {
        const params = new URLSearchParams(searchParams)
        if (categoryId) params.set('category', categoryId)
        else params.delete('category')
        const query = params.toString()
        router.push(query ? `${pathname}?${query}` : pathname)
      }}
    />
  )
}
