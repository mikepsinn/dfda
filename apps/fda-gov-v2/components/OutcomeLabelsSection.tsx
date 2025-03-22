import Link from "next/link"
import { Button } from "@/components/ui/button"

export function OutcomeLabelsSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
      <div className="container px-4 md:px-6">
        <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Outcome Labels</h2>
            <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
              See the quantitative effects of foods and drugs on all measurable aspects of human health
            </p>
            <ul className="grid gap-2">
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-primary"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Comprehensive health impact data</span>
              </li>
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-primary"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Both positive and negative effects</span>
              </li>
              <li className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 text-primary"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>Evidence-based decision making</span>
              </li>
            </ul>
            <Link href="/outcome-labels">
              <Button variant="outline">Learn More</Button>
            </Link>
          </div>
          <div className="rounded-lg border bg-background p-8">
            <div className="space-y-4">
              <h3 className="text-xl font-bold">Sample Outcome Label: Atorvastatin 20mg</h3>
              <div className="space-y-4">
                <div className="rounded-md border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-semibold text-lg">Atorvastatin 20mg daily</span>
                    <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Lipid-lowering agent
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="border-b pb-2">
                      <div className="text-sm font-medium mb-1">Primary Outcomes</div>
                      <div className="space-y-3 sm:space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                          <div className="flex items-center">
                            <span className="text-sm">LDL Cholesterol</span>
                            <span className="ml-2 text-xs text-muted-foreground">(baseline: 160 mg/dL)</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-green-600">-43% (-69 mg/dL)</span>
                            <div className="ml-2 h-2 w-16 rounded-full bg-gray-200">
                              <div className="h-2 w-11 rounded-full bg-green-600"></div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                          <div className="flex items-center">
                            <span className="text-sm">Total Cholesterol</span>
                            <span className="ml-2 text-xs text-muted-foreground">(baseline: 240 mg/dL)</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-green-600">-32% (-77 mg/dL)</span>
                            <div className="ml-2 h-2 w-16 rounded-full bg-gray-200">
                              <div className="h-2 w-8 rounded-full bg-green-600"></div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                          <div className="flex items-center">
                            <span className="text-sm">Cardiovascular Event Risk</span>
                            <span className="ml-2 text-xs text-muted-foreground">(10-year risk)</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-green-600">-36% (absolute: -4.2%)</span>
                            <div className="ml-2 h-2 w-16 rounded-full bg-gray-200">
                              <div className="h-2 w-9 rounded-full bg-green-600"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-b pb-2">
                      <div className="text-sm font-medium mb-1">Secondary Benefits</div>
                      <div className="space-y-3 sm:space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                          <span className="text-sm">HDL Cholesterol</span>
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-green-600">+5% (+2.3 mg/dL)</span>
                            <div className="ml-2 h-2 w-16 rounded-full bg-gray-200">
                              <div className="h-2 w-2 rounded-full bg-green-600"></div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                          <span className="text-sm">Triglycerides</span>
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-green-600">-22% (-35 mg/dL)</span>
                            <div className="ml-2 h-2 w-16 rounded-full bg-gray-200">
                              <div className="h-2 w-6 rounded-full bg-green-600"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-1">Side Effects</div>
                      <div className="space-y-3 sm:space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                          <div className="flex items-center">
                            <span className="text-sm">Muscle Pain/Weakness</span>
                            <span className="ml-2 text-xs text-muted-foreground">(vs. placebo)</span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-red-600">+8.2% (NNH: 12)</span>
                            <div className="ml-2 h-2 w-16 rounded-full bg-gray-200">
                              <div className="h-2 w-3 rounded-full bg-red-600"></div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                          <span className="text-sm">Liver Enzyme Elevation</span>
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-red-600">+1.2% (NNH: 83)</span>
                            <div className="ml-2 h-2 w-16 rounded-full bg-gray-200">
                              <div className="h-2 w-1 rounded-full bg-red-600"></div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                          <span className="text-sm">Headache</span>
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-red-600">+3.8% (NNH: 26)</span>
                            <div className="ml-2 h-2 w-16 rounded-full bg-gray-200">
                              <div className="h-2 w-2 rounded-full bg-red-600"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Based on 42 clinical trials with 48,500 participants</span>
                      <span>Last updated: Feb 2025</span>
                    </div>
                    <div className="mt-1">
                      <span>NNH = Number Needed to Harm (patients treated for one additional adverse event)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

