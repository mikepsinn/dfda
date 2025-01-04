"use client"

import { SearchParams } from "@/types"


interface DashboardCardsProps {
  searchParams?: SearchParams
}

export function DashboardCards({ searchParams }: DashboardCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/*            <LinkCard navItem={wishingWellsLink}/>
            <LinkCard navItem={wishingWellsResultsLink}/>*/}
      {/*<LinkCard navItem={globalSolutionsVoteLink}/>*/}
      {/*<LinkCard navItem={globalSolutionsResultsLink}/>*/}
    </div>
  )
}
