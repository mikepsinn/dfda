import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TrialContentProps {
  trial: any // Using any for brevity, but should be properly typed
}

export function TrialContent({ trial }: TrialContentProps) {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="eligibility">Eligibility</TabsTrigger>
        <TabsTrigger value="procedures">Procedures</TabsTrigger>
        <TabsTrigger value="locations">Locations</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Trial Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">{trial.description}</p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Conditions</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {trial.conditions?.map((item: any) => <li key={item.condition_id}>{item.conditions?.name}</li>) || (
                  <li>Information not available</li>
                )}
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">Treatments</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {trial.treatments?.map((item: any) => (
                  <li key={item.treatment_id}>
                    <span className="font-medium">{item.treatments?.name}</span>
                    {item.treatments?.description && <span> - {item.treatments.description}</span>}
                  </li>
                )) || <li>Information not available</li>}
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">Timeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium">Enrollment</p>
                  <p className="text-sm text-muted-foreground">{trial.timeline?.enrollment || "Ongoing"}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium">Duration</p>
                  <p className="text-sm text-muted-foreground">{trial.timeline?.duration || "12 weeks"}</p>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium">Follow-up</p>
                  <p className="text-sm text-muted-foreground">{trial.timeline?.followUp || "6 months"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="eligibility" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Eligibility Criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {trial.eligibility?.map((criterion: string, index: number) => (
                <li key={index} className="text-sm">
                  {criterion}
                </li>
              )) || <li className="text-sm">Eligibility information not available</li>}
            </ul>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="procedures" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Study Procedures</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal pl-5 space-y-2">
              {trial.procedures?.map((procedure: string, index: number) => (
                <li key={index} className="text-sm">
                  {procedure}
                </li>
              )) || <li className="text-sm">Procedure information not available</li>}
            </ol>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="locations" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Trial Locations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {trial.locations?.map((location: any, index: number) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{location.name}</h3>
                  {location.remote && (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Remote
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{location.address}</p>
              </div>
            )) || <p className="text-sm text-muted-foreground">Location information not available</p>}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

