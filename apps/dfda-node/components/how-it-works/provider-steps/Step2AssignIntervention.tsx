import { FileText, ClipboardCheck } from "lucide-react";
import { HowItWorksStep } from "../HowItWorksStep";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function Step2AssignIntervention() {
  return (
    <HowItWorksStep
      stepNumber={2}
      title="Assign Patients to Trial Arms with Confidence"
      icon={<ClipboardCheck className="h-5 w-5 text-primary" />}
      description="Review detailed outcome labels, compare trial arms (including placebo/standard of care), and assign patients directly."
      benefits={[
        "Make informed decisions with transparent outcome data",
        "Compare effectiveness and side effect profiles easily",
        "Assign patients to specific trial arms seamlessly",
        "Integrate assignment with patient management workflows",
      ]}
      preview={
        <div className="bg-background rounded-lg border shadow-lg p-4 w-full max-w-md">
          <div className="space-y-4">
            <div className="font-bold text-lg border-b pb-2">Lecanemab Trial - Patient: J. Doe</div>
            <div className="space-y-4">
              {/* Trial Arm 1: Lecanemab */}
              <div>
                <div className="font-medium text-sm mb-2 flex justify-between items-center">
                  <span>Arm 1: Lecanemab (Bi-weekly IV)</span>
                  <Badge>Active</Badge>
                </div>
                <div className="space-y-3 border rounded-md p-3">
                  {/* Effectiveness */}
                  <div>
                    <div className="flex justify-between text-xs">
                      <span>Cognitive Function (ADAS-Cog)</span>
                      <span className="text-green-600">+28%</span>
                    </div>
                    <div className="h-3 w-full bg-gray-200 rounded-full mt-1">
                      <div className="h-3 bg-green-500 rounded-full" style={{ width: "28%" }}></div>
                    </div>
                  </div>
                  {/* Side Effects */}
                  <div>
                     <div className="font-medium text-xs mb-1 pt-2">Key Side Effects:</div>
                     <div className="flex justify-between text-xs">
                      <span>Immune Response (ARIA)</span>
                      <span>12%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full mt-1">
                      <div className="h-2 bg-amber-400 rounded-full" style={{ width: "12%" }}></div>
                    </div>
                  </div>
                   <Button size="sm" className="mt-3 w-full">Assign to Lecanemab Arm</Button>
                </div>
              </div>

              {/* Trial Arm 2: Placebo */}
              <div>
                <div className="font-medium text-sm mb-2 flex justify-between items-center">
                  <span>Arm 2: Placebo (Bi-weekly IV)</span>
                   <Badge variant="secondary">Control</Badge>
                </div>
                <div className="space-y-3 border rounded-md p-3 bg-muted/30">
                   {/* Effectiveness */}
                  <div>
                    <div className="flex justify-between text-xs">
                      <span>Cognitive Function (ADAS-Cog)</span>
                      <span className="text-orange-600">-5%</span>
                    </div>
                    <div className="h-3 w-full bg-gray-200 rounded-full mt-1">
                      {/* Negative change indication could be different */}
                    </div>
                  </div>
                   {/* Side Effects */}
                  <div>
                     <div className="font-medium text-xs mb-1 pt-2">Key Side Effects:</div>
                     <div className="flex justify-between text-xs">
                      <span>Headache</span>
                      <span>5%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 rounded-full mt-1">
                      <div className="h-2 bg-amber-400 rounded-full" style={{ width: "5%" }}></div>
                    </div>
                  </div>
                   <Button size="sm" variant="secondary" className="mt-3 w-full">Assign to Placebo Arm</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
      reverse={true}
    />
  );
} 