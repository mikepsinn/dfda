'use client'
import { TrendingUp } from "lucide-react";
import { HowItWorksStep } from "../HowItWorksStep";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Step3MonitorProgress() {
  return (
    <HowItWorksStep
      stepNumber={3}
      title="Monitor Patient Progress & Trial Performance"
      icon={<TrendingUp className="h-5 w-5 text-primary" />}
      description="Track key metrics, patient-reported outcomes, and overall trial status through an intuitive dashboard."
      benefits={[
        "Visualize patient progress over time",
        "Monitor adherence and adverse events easily",
        "Track enrollment rates and trial milestones",
        "Generate reports for analysis and regulatory needs",
      ]}
      preview={
        <div className="bg-background rounded-lg border shadow-lg p-4 w-full max-w-md">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Lecanemab Trial Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Enrollment Progress</span>
                <span className="text-sm font-bold">42 / 100 Patients</span>
              </div>
              <div className="h-3 w-full bg-gray-200 rounded-full">
                 <div className="h-3 bg-primary rounded-full" style={{ width: "42%" }}></div>
              </div>

              <div className="border-t pt-4">
                <div className="text-sm font-medium mb-2">Patient Group Performance (ADAS-Cog Avg. Change)</div>
                <div className="flex justify-around text-center">
                  <div>
                    <div className="text-lg font-bold text-green-600">+28%</div>
                    <div className="text-xs text-muted-foreground">Lecanemab Arm</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-orange-600">-5%</div>
                     <div className="text-xs text-muted-foreground">Placebo Arm</div>
                  </div>
                </div>
              </div>

               <div className="border-t pt-4">
                 <div className="text-sm font-medium mb-2">Recent Adverse Events</div>
                  <div className="text-xs space-y-1">
                    <p><span className="font-semibold">P12345:</span> Mild ARIA reported</p>
                    <p><span className="font-semibold">P67890:</span> Headache (resolved)</p>
                  </div>
               </div>

            </CardContent>
          </Card>
        </div>
      }
      reverse={false}
    />
  );
} 