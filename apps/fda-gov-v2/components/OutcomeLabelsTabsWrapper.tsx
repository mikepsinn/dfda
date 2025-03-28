"use client"

import type React from "react"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

export function OutcomeLabelsTabsWrapper() {
  return (
    <Tabs defaultValue="medications">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="medications">Medications</TabsTrigger>
        <TabsTrigger value="supplements">Supplements</TabsTrigger>
        <TabsTrigger value="foods">Foods</TabsTrigger>
        <TabsTrigger value="lifestyle">Lifestyle</TabsTrigger>
      </TabsList>
      <TabsContent value="medications" className="space-y-4 pt-4">
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          <Button variant="outline" className="justify-start">
            Statins
          </Button>
          <Button variant="outline" className="justify-start">
            Antidepressants
          </Button>
          <Button variant="outline" className="justify-start">
            Blood Pressure Medications
          </Button>
          <Button variant="outline" className="justify-start">
            Diabetes Medications
          </Button>
          <Button variant="outline" className="justify-start">
            Pain Relievers
          </Button>
          <Button variant="outline" className="justify-start">
            Sleep Aids
          </Button>
          <Button variant="outline" className="justify-start">
            Antihistamines
          </Button>
          <Button variant="outline" className="justify-start">
            Antibiotics
          </Button>
          <Button variant="outline" className="justify-start">
            View All →
          </Button>
        </div>
      </TabsContent>
      <TabsContent value="supplements" className="space-y-4 pt-4">
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          <Button variant="outline" className="justify-start">
            Vitamin D
          </Button>
          <Button variant="outline" className="justify-start">
            Omega-3
          </Button>
          <Button variant="outline" className="justify-start">
            Probiotics
          </Button>
          <Button variant="outline" className="justify-start">
            Magnesium
          </Button>
          <Button variant="outline" className="justify-start">
            Zinc
          </Button>
          <Button variant="outline" className="justify-start">
            Melatonin
          </Button>
          <Button variant="outline" className="justify-start">
            Turmeric/Curcumin
          </Button>
          <Button variant="outline" className="justify-start">
            Vitamin B Complex
          </Button>
          <Button variant="outline" className="justify-start">
            View All →
          </Button>
        </div>
      </TabsContent>
      <TabsContent value="foods" className="pt-4">
        <p className="text-center text-muted-foreground py-8">Food outcome labels coming soon</p>
      </TabsContent>
      <TabsContent value="lifestyle" className="pt-4">
        <p className="text-center text-muted-foreground py-8">Lifestyle intervention outcome labels coming soon</p>
      </TabsContent>
    </Tabs>
  )
}
