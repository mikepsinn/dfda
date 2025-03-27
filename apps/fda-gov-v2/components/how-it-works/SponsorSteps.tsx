import { Upload, Shield, Settings, BarChart3, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { SponsorStep } from "./SponsorStep"

export function SponsorSteps() {
  return (
    <div className="space-y-16 relative">
      {/* Step 1: Create a Trial */}
      <SponsorStep
        stepNumber={1}
        title="Create a Trial"
        icon={<Upload className="h-5 w-5 text-primary" />}
        description="Upload protocols, pre/post-clinical data, and register your supply chain through the Decentralized FDA's intuitive interface."
        benefits={[
          "Simple protocol builder with templates",
          "Automated regulatory compliance checks",
          "Secure data storage and management",
        ]}
        preview={
          <div className="w-full max-w-[320px] rounded-lg border shadow-md overflow-hidden bg-background">
            {/* Mini Create Trial Page Preview */}
            <div className="p-3 border-b bg-muted/30">
              <div className="text-sm font-medium">Create New Trial</div>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Trial Name</Label>
                <Input placeholder="Type 2 Diabetes Treatment Study" className="h-8 text-xs" disabled />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Therapeutic Area</Label>
                <Select disabled>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Endocrinology" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="endocrinology">Endocrinology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Protocol Upload</Label>
                <div className="border border-dashed rounded-md p-2 flex items-center justify-center">
                  <div className="text-xs text-muted-foreground flex items-center">
                    <Upload className="h-3 w-3 mr-1" /> Upload Protocol
                  </div>
                </div>
              </div>
              <Button size="sm" className="w-full text-xs" disabled>
                Continue
              </Button>
            </div>
          </div>
        }
        reverse={false}
      />

      {/* Step 2: Get Insurance */}
      <SponsorStep
        stepNumber={2}
        title="Get Liability Insurance"
        icon={<Shield className="h-5 w-5 text-primary" />}
        description="Automatically receive and select liability insurance quotes per subject with transparent pricing."
        benefits={[
          "Competitive quotes from multiple providers",
          "Risk-based pricing tailored to your trial",
          "One-click policy activation",
        ]}
        preview={
          <div className="w-full max-w-[320px] rounded-lg border shadow-md overflow-hidden bg-background">
            {/* Mini Insurance Page Preview */}
            <div className="p-3 border-b bg-muted/30">
              <div className="text-sm font-medium">Select Liability Insurance</div>
            </div>
            <div className="p-4 space-y-4">
              <div className="rounded-lg border p-3 bg-muted/20">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-medium">SafeTrial Liability Insurance</div>
                    <div className="text-xs text-muted-foreground mt-1">Comprehensive coverage</div>
                  </div>
                  <Badge className="text-xs">Recommended</Badge>
                </div>
                <div className="mt-2 text-xs">
                  <div className="flex justify-between">
                    <span>Per participant:</span>
                    <span className="font-medium">$45</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs font-medium">MedSecure Plus</div>
                    <div className="text-xs text-muted-foreground mt-1">Basic coverage</div>
                  </div>
                </div>
                <div className="mt-2 text-xs">
                  <div className="flex justify-between">
                    <span>Per participant:</span>
                    <span className="font-medium">$32</span>
                  </div>
                </div>
              </div>

              <Button size="sm" className="w-full text-xs" disabled>
                Select Plan
              </Button>
            </div>
          </div>
        }
        reverse={true}
      />

      {/* Step 3: Set Parameters */}
      <SponsorStep
        stepNumber={3}
        title="Set Parameters"
        icon={<Settings className="h-5 w-5 text-primary" />}
        description="Define patient pricing, required data collection, and refundable deposits to optimize your trial."
        benefits={[
          "Flexible pricing models for participants",
          "Customizable data collection requirements",
          "Incentive structures to maximize retention",
        ]}
        preview={
          <div className="w-full max-w-[320px] rounded-lg border shadow-md overflow-hidden bg-background">
            {/* Mini Parameters Page Preview */}
            <div className="p-3 border-b bg-muted/30">
              <div className="text-sm font-medium">Trial Parameters</div>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs">Participant Cost</Label>
                <div className="flex items-center space-x-2">
                  <Input placeholder="100" className="h-8 text-xs" disabled />
                  <span className="text-xs">USD</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Refundable Deposit</Label>
                <div className="flex items-center space-x-2">
                  <Input placeholder="50" className="h-8 text-xs" disabled />
                  <span className="text-xs">%</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Required Data Points</Label>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    Blood Glucose
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Weight
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Activity
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Diet
                  </Badge>
                </div>
              </div>
              <Button size="sm" className="w-full text-xs" disabled>
                Save Parameters
              </Button>
            </div>
          </div>
        }
        reverse={false}
      />

      {/* Step 4: Manage Supply Chain & Orders */}
      <SponsorStep
        stepNumber={4}
        title="Manage Supply Chain & Orders"
        icon={<Package className="h-5 w-5 text-primary" />}
        description="Track inventory, fulfill patient orders, and manage the entire treatment supply chain with end-to-end visibility."
        benefits={[
          "Automated inventory tracking and alerts",
          "Secure patient order processing and fulfillment",
          "Temperature-controlled shipping monitoring",
          "Blockchain-verified chain of custody",
        ]}
        preview={
          <div className="w-full max-w-[320px] rounded-lg border shadow-md overflow-hidden bg-background">
            {/* Mini Supply Chain Dashboard Preview */}
            <div className="p-3 border-b bg-muted/30">
              <div className="text-sm font-medium">Supply Chain Dashboard</div>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="text-xs font-medium">Inventory Status</div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border p-2">
                    <div className="text-xs text-muted-foreground">In Stock</div>
                    <div className="text-sm font-bold">1,250 units</div>
                  </div>
                  <div className="rounded-lg border p-2">
                    <div className="text-xs text-muted-foreground">Allocated</div>
                    <div className="text-sm font-bold">840 units</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium">Recent Orders</div>
                <div className="space-y-2 max-h-[100px] overflow-y-auto">
                  <div className="rounded-md border p-2 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-medium">#ORD-2845</div>
                      <div className="text-xs text-muted-foreground">2 units • Processing</div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      New
                    </Badge>
                  </div>
                  <div className="rounded-md border p-2 flex justify-between items-center">
                    <div>
                      <div className="text-xs font-medium">#ORD-2844</div>
                      <div className="text-xs text-muted-foreground">1 unit • Shipped</div>
                    </div>
                    <div className="text-xs text-green-500">Delivered</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium">Supply Chain Map</div>
                <div className="h-16 bg-muted/20 rounded-lg flex items-center justify-center">
                  <div className="text-xs text-muted-foreground">Interactive map view</div>
                </div>
              </div>

              <Button size="sm" className="w-full text-xs" disabled>
                Manage Inventory
              </Button>
            </div>
          </div>
        }
        reverse={true}
      />

      {/* Step 5: Manage Your Trial */}
      <SponsorStep
        stepNumber={5}
        title="Manage Your Trial"
        icon={<BarChart3 className="h-5 w-5 text-primary" />}
        description="Track enrollment, monitor data collection, and analyze results in real-time through the Decentralized FDA dashboard."
        benefits={[
          "Real-time enrollment tracking",
          "Automated data quality monitoring",
          "Advanced analytics and visualization tools",
        ]}
        preview={
          <div className="w-full max-w-[320px] rounded-lg border shadow-md overflow-hidden bg-background">
            {/* Mini Dashboard Preview */}
            <div className="p-3 border-b bg-muted/30">
              <div className="text-sm font-medium">Trial Dashboard</div>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <div className="text-xs font-medium">Enrollment Progress</div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="bg-primary h-full" style={{ width: "65%" }}></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>325/500 enrolled</span>
                  <span>65%</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium">Data Completion Rate</div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: "92%" }}></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>92% complete</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg border p-2">
                  <div className="text-xs text-muted-foreground">Avg. Adherence</div>
                  <div className="text-sm font-bold">94%</div>
                </div>
                <div className="rounded-lg border p-2">
                  <div className="text-xs text-muted-foreground">Dropout Rate</div>
                  <div className="text-sm font-bold">3.2%</div>
                </div>
              </div>

              <Button size="sm" className="w-full text-xs" disabled>
                View Details
              </Button>
            </div>
          </div>
        }
        reverse={true}
      />
    </div>
  )
}

