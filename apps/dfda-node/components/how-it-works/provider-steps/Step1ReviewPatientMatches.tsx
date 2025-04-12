import { Users, Search } from "lucide-react";
import { HowItWorksStep } from "../HowItWorksStep";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Step1ReviewPatientMatches() {
  return (
    <HowItWorksStep
      stepNumber={1}
      title="Review AI-Ranked Trial Matches for Your Patients"
      icon={<Users className="h-5 w-5 text-primary" />}
      description="Our AI analyzes patient EHR data to identify and rank the most suitable and effective clinical trials, saving you time."
      benefits={[
        "Leverage AI for precise patient-trial matching",
        "View ranked lists based on predicted effectiveness",
        "Quickly assess eligibility criteria against patient data",
        "Focus on the most promising options first",
      ]}
      preview={
        <div className="bg-background rounded-lg border shadow-lg p-4 w-full max-w-md">
          <div className="space-y-4">
            <div className="font-bold text-lg border-b pb-2">Patient: John Doe (ID: P12345)</div>
            <div className="text-sm font-medium mb-2">Top Trial Matches (Condition: Alzheimer's)</div>

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {[
                { name: "Lecanemab (Leqembi)", effectiveness: 92, match: 95, status: "Recruiting" },
                { name: "Donanemab Trial", effectiveness: 88, match: 91, status: "Recruiting" },
                { name: "APOE4 Gene Therapy", effectiveness: 65, match: 85, status: "Recruiting" },
                { name: "Neuroinflammation Modulator", effectiveness: 61, match: 82, status: "Screening" },
              ].map((trial, i) => (
                <div
                  key={i}
                  className="rounded-lg border p-3 bg-card hover:bg-accent hover:cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="font-medium">{trial.name}</div>
                    <Badge variant="outline">{trial.status}</Badge>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">AI Match Score:</div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-blue-500 rounded-full h-2"
                        style={{ width: `${trial.match}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium">{trial.match}%</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">Predicted Effectiveness:</div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2"
                        style={{ width: `${trial.effectiveness}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium">{trial.effectiveness}%</span>
                  </div>
                  <Button size="sm" variant="outline" className="mt-3 w-full">View Details & Assign</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
      reverse={false}
    />
  );
} 