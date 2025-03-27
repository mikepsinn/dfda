import { Search } from "lucide-react"
import { PatientStep } from "../PatientStep"

export function Step1FindTrials() {
  return (
    <PatientStep
      stepNumber={1}
      title="Find the Most Promising Treatment for Your Condition"
      icon={<Search className="h-5 w-5 text-primary" />}
      description="Search for trials based on your condition, location, and preferences."
      benefits={[
        "Access trials from anywhere in the world",
        "Filter by condition, treatment type, and more",
        "See real-time availability and enrollment status",
        "Compare multiple treatment options side-by-side",
      ]}
      preview={
        <div className="bg-background rounded-lg border shadow-lg p-4 w-full max-w-md">
          <div className="space-y-4">
            <div className="rounded-md border px-3 py-2 flex items-center gap-2 bg-background">
              <Search className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Alzheimer's</span>
            </div>

            <div className="text-sm font-medium mb-2">Comparative Effectiveness Rankings</div>

            <div className="text-xs text-muted-foreground mb-2 flex items-center justify-center bg-primary/5 py-1.5 rounded-md">
              <span>Click any treatment to view available trials</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-1"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </div>

            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {[
                { name: "Lecanemab (Leqembi)", effectiveness: 92, status: "FDA Approved" },
                { name: "Donanemab", effectiveness: 88, status: "Phase 3" },
                { name: "Aducanumab (Aduhelm)", effectiveness: 76, status: "FDA Approved" },
                { name: "Experimental Tau Inhibitor", effectiveness: 72, status: "Phase 2" },
                { name: "Memantine + Donepezil", effectiveness: 68, status: "FDA Approved" },
                { name: "APOE4 Gene Therapy", effectiveness: 65, status: "Phase 2" },
                { name: "Neuroinflammation Modulator", effectiveness: 61, status: "Phase 2" },
                { name: "Donepezil (Aricept)", effectiveness: 58, status: "FDA Approved" },
                { name: "Memantine (Namenda)", effectiveness: 52, status: "FDA Approved" },
                { name: "Rivastigmine (Exelon)", effectiveness: 49, status: "FDA Approved" },
                { name: "Galantamine (Razadyne)", effectiveness: 47, status: "FDA Approved" },
                { name: "Stem Cell Therapy", effectiveness: 45, status: "Phase 1" },
                { name: "GLP-1 Receptor Agonist", effectiveness: 42, status: "Phase 2" },
              ].map((treatment, i) => (
                <div
                  key={i}
                  className="rounded-lg border p-3 bg-card hover:bg-accent hover:cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{treatment.name}</div>
                    <div className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {treatment.status}
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-2">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2"
                        style={{ width: `${treatment.effectiveness}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-medium">{treatment.effectiveness}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
      reverse={false}
    />
  )
}

