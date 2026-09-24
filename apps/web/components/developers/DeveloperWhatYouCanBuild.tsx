import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DeveloperWhatYouCanBuild() {
  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold text-center mb-6">What You Can Build</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">EHR Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Securely connect patient health records to clinical trials with user consent, streamlining data
              collection and improving trial matching.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Treatment Comparison Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Build interactive tools that help patients and providers compare treatment options based on
              real-world effectiveness data.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Personalized Health Dashboards</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create customized health dashboards that combine user data with aggregated insights from similar
              patients.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Trial Matching Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Develop sophisticated matching algorithms that connect patients to the most promising trials for
              their specific condition.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 