import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface TreatmentDetailsProps {
  treatment: any
  conditionId: string
}

export function TreatmentDetails({ treatment, conditionId }: TreatmentDetailsProps) {
  return (
    <div className="w-full space-y-4">
      <Link 
        href={`/condition/${conditionId}`} 
        className="inline-flex items-center text-sm text-primary hover:underline mb-4"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Condition Details
      </Link>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="effectiveness">Effectiveness</TabsTrigger>
          <TabsTrigger value="side-effects">Side Effects</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Treatment Overview</CardTitle>
              <CardDescription>General information about {treatment.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p>{treatment.description || "No description available."}</p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Administration</h3>
                <p>{treatment.administration_method || "Information not available."}</p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Typical Duration</h3>
                <p>{treatment.typical_duration || "Information not available."}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="effectiveness">
          <Card>
            <CardHeader>
              <CardTitle>Effectiveness Data</CardTitle>
              <CardDescription>Clinical outcomes and effectiveness for {treatment.name}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Clinical Effectiveness</h3>
                <p>{treatment.effectiveness_data || "No effectiveness data available yet."}</p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Success Rate</h3>
                <p>{treatment.success_rate || "Information not available."}</p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Comparative Studies</h3>
                <p>{treatment.comparative_data || "No comparative studies available."}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="side-effects">
          <Card>
            <CardHeader>
              <CardTitle>Side Effects</CardTitle>
              <CardDescription>Known side effects and safety information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Common Side Effects</h3>
                <p>{treatment.side_effects || "No side effect data available."}</p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Safety Considerations</h3>
                <p>{treatment.safety_info || "Information not available."}</p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Contraindications</h3>
                <p>{treatment.contraindications || "No contraindications listed."}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
