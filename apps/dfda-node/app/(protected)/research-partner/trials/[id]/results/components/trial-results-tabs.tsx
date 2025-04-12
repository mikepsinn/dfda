"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart, LineChart, PieChart, Users } from "lucide-react"

// Define a more specific type for the data needed by the tabs
// This should ideally come from your actual data types
interface TrialResultsTabsProps {
  trialData: {
    efficacy: any // Replace 'any' with specific types
    safety: any   // Replace 'any' with specific types
    demographics: any // Replace 'any' with specific types
    // Add other necessary data parts like engagement if needed
  }
}

export function TrialResultsTabs({ trialData }: TrialResultsTabsProps) {
  // Basic check to prevent rendering errors if data is missing
  if (!trialData || !trialData.efficacy || !trialData.safety || !trialData.demographics) {
    return <div>Loading results data...</div>
  }

  return (
    <Tabs defaultValue="efficacy" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="efficacy">Efficacy</TabsTrigger>
        <TabsTrigger value="safety">Safety</TabsTrigger>
        <TabsTrigger value="demographics">Demographics</TabsTrigger>
        <TabsTrigger value="engagement">Engagement</TabsTrigger>
      </TabsList>

      {/* Efficacy Tab Content */}
      <TabsContent value="efficacy" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Primary Endpoint</CardTitle>
            <CardDescription>{trialData.efficacy.primaryEndpoint.name}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for actual chart component */}
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Primary Endpoint Results</h3>
                {/* ... (rest of primary endpoint display logic) ... */}
                <div className="mt-4 grid grid-cols-2 gap-8 max-w-md mx-auto">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">Treatment Group</div>
                    <div className="text-2xl font-bold text-primary">
                      {trialData.efficacy.primaryEndpoint.treatmentGroup > 0 ? "+" : ""}
                      {trialData.efficacy.primaryEndpoint.treatmentGroup}%
                    </div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">Control Group</div>
                    <div className="text-2xl font-bold">
                      {trialData.efficacy.primaryEndpoint.controlGroup > 0 ? "+" : ""}
                      {trialData.efficacy.primaryEndpoint.controlGroup}%
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-sm">
                  <span className="font-medium">p-value:</span> {trialData.efficacy.primaryEndpoint.pValue}
                  <span className="ml-2 text-green-600 font-medium">(Statistically Significant)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Secondary Endpoints</CardTitle>
            <CardDescription>Additional efficacy measurements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {trialData.efficacy.secondaryEndpoints.map((endpoint: any, index: number) => (
                <div key={index} className="rounded-lg border p-4">
                  <h3 className="font-medium mb-4">{endpoint.name}</h3>
                  {/* ... (rest of secondary endpoint display logic) ... */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="rounded-lg bg-muted p-3 text-center">
                      <div className="text-sm text-muted-foreground">Treatment Group</div>
                      <div className="text-xl font-bold text-primary">
                        {endpoint.treatmentGroup > 0 ? "+" : ""}
                        {endpoint.treatmentGroup} {endpoint.unit}
                      </div>
                    </div>
                    <div className="rounded-lg bg-muted p-3 text-center">
                      <div className="text-sm text-muted-foreground">Control Group</div>
                      <div className="text-xl font-bold">
                        {endpoint.controlGroup > 0 ? "+" : ""}
                        {endpoint.controlGroup} {endpoint.unit}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">p-value:</span> {endpoint.pValue}
                    {endpoint.pValue < 0.05 && (
                      <span className="ml-2 text-green-600 font-medium">(Statistically Significant)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Safety Tab Content */}
      <TabsContent value="safety" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Adverse Events</CardTitle>
            <CardDescription>Reported side effects and adverse events</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for actual chart component */}
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <BarChart className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Adverse Events Comparison</h3>
                {/* ... (rest of adverse events display logic) ... */}
                <div className="mt-6 space-y-4 max-w-2xl mx-auto">
                  {trialData.safety.adverseEvents.map((event: any, index: number) => (
                    <div key={index} className="grid grid-cols-3 items-center gap-4">
                      <div className="text-sm font-medium text-right">{event.name}</div>
                      <div className="col-span-2 flex items-center gap-2">
                        {/* Example bar display - replace with actual chart */}
                        <div className="flex-1 bg-primary/20 rounded h-2.5" style={{ width: `${event.treatment * 5}%`}}></div>
                        <div className="text-xs font-mono text-primary">{event.treatment}%</div>
                        <div className="flex-1 bg-muted rounded h-2.5" style={{ width: `${event.control * 5}%`}}></div>
                        <div className="text-xs font-mono text-muted-foreground">{event.control}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Serious Adverse Events</CardTitle>
            <CardDescription>Significant adverse events reported</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm">
              {trialData.safety.seriousEvents.map((event: any, index: number) => (
                <li key={index}>
                  {event.name} (Treatment: {event.treatment}, Control: {event.control})
                </li>
              ))}
              {trialData.safety.seriousEvents.length === 0 && (
                <li className="text-muted-foreground">No serious adverse events reported.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Demographics Tab Content */}
      <TabsContent value="demographics" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Gender Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Placeholder for actual chart component */}
              <div className="h-[250px] flex items-center justify-center">
                <PieChart className="h-12 w-12 text-muted-foreground" />
                {/* ... (display logic for gender) ... */}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Age Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Placeholder for actual chart component */}
              <div className="h-[250px] flex items-center justify-center">
                <BarChart className="h-12 w-12 text-muted-foreground" />
                {/* ... (display logic for age) ... */}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Ethnicity Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Placeholder for actual chart component */}
              <div className="h-[250px] flex items-center justify-center">
                <PieChart className="h-12 w-12 text-muted-foreground" />
                {/* ... (display logic for ethnicity) ... */}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Engagement Tab Content */}
      <TabsContent value="engagement" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Participant Engagement</CardTitle>
            <CardDescription>Metrics on participant activity and data submission</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for actual chart component */}
            <div className="h-[300px] flex items-center justify-center">
              <LineChart className="h-12 w-12 text-muted-foreground" />
              <span className="ml-4 text-muted-foreground">(Engagement data visualization placeholder)</span>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
} 