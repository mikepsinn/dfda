"use client"

import type React from "react"
import Link from 'next/link'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { getTreatmentVariables, getFoodVariables } from "@/app/actions/global-variables"

// Define prop types using the renamed interface
interface SimpleVariableInfo { id: string; name: string; }
interface OutcomeLabelsTabsWrapperProps {
  treatmentData: SimpleVariableInfo[];
  foodData: SimpleVariableInfo[];
}

// Make it a regular (non-async) component accepting props
export function OutcomeLabelsTabsWrapper({ treatmentData, foodData }: OutcomeLabelsTabsWrapperProps) {
  // No data fetching here anymore

  return (
    <Tabs defaultValue="treatments">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="treatments">Treatments</TabsTrigger>
        <TabsTrigger value="foods">Foods</TabsTrigger>
      </TabsList>
      <TabsContent value="treatments" className="space-y-4 pt-4">
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {treatmentData.length > 0 ? (
            treatmentData.map((item) => (
              <Link key={item.id} href={`/outcome-labels/${encodeURIComponent(item.id)}`} passHref legacyBehavior>
                <Button variant="outline" className="justify-start w-full truncate">
                  {item.name}
                </Button>
              </Link>
            ))
          ) : (
            <p className="col-span-full text-center text-muted-foreground py-4">No treatments found.</p>
          )}
        </div>
      </TabsContent>
      <TabsContent value="foods" className="pt-4">
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {foodData.length > 0 ? (
            foodData.map((item) => (
              <Link key={item.id} href={`/outcome-labels/${encodeURIComponent(item.id)}`} passHref legacyBehavior>
                <Button variant="outline" className="justify-start w-full truncate">
                  {item.name}
                </Button>
              </Link>
            ))
          ) : (
            <p className="col-span-full text-center text-muted-foreground py-4">No foods found.</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
