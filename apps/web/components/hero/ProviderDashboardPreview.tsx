import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

// Static data for the preview
const fakeRankings = [
  { name: "Lecanemab Trial (Alzheimer's)", effectiveness: 92, match: 95, status: "Recruiting" },
  { name: "Donanemab Phase 3", effectiveness: 88, match: 91, status: "Recruiting" },
  { name: "APOE4 Gene Therapy", effectiveness: 65, match: 85, status: "Screening" },
];

export function ProviderDashboardPreview() {
  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">AI Trial Matching Preview</CardTitle>
        <p className="text-xs text-muted-foreground">Top matches for Patient J. Doe</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {fakeRankings.map((trial, i) => (
            <div
              key={i}
              className="rounded-lg border p-3 bg-card/50"
            >
              <div className="flex justify-between items-start mb-1.5">
                <div className="font-medium text-sm truncate pr-2">{trial.name}</div>
                <Badge variant="outline" className="text-xs whitespace-nowrap">{trial.status}</Badge>
              </div>

              <div className="mb-2">
                <div className="flex justify-between items-center mb-0.5">
                   <span className="text-xs text-muted-foreground">AI Match Score</span>
                   <span className="text-xs font-medium">{trial.match}%</span>
                </div>
                <Progress value={trial.match} className="h-1.5 bg-blue-100 [&>div]:bg-blue-500" />
              </div>

              <div className="mb-2.5">
                 <div className="flex justify-between items-center mb-0.5">
                    <span className="text-xs text-muted-foreground">Predicted Effectiveness</span>
                    <span className="text-xs font-medium">{trial.effectiveness}%</span>
                </div>
                <Progress value={trial.effectiveness} className="h-1.5" />
              </div>

              <Button size="sm" variant="ghost" className="w-full h-7 px-2 text-xs text-muted-foreground justify-center items-center">
                View Details & Assign Patient
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 