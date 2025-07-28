import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown } from "lucide-react"

export function DeveloperPricingPlans() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Free</CardTitle>
          <CardDescription>For developers and small projects</CardDescription>
          <div className="mt-4">
            <span className="text-3xl font-bold">$0</span>
            <span className="text-muted-foreground">/month</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
              <span>100 requests/hour</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
              <span>Access to public trial data</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
              <span>Basic outcome labels</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
              <span>Community support</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            Get Started
          </Button>
        </CardFooter>
      </Card>

      <Card className="border-2 border-primary">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Basic</CardTitle>
            <div className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full">
              Popular
            </div>
          </div>
          <CardDescription>For startups and growing companies</CardDescription>
          <div className="mt-4">
            <span className="text-3xl font-bold">$99</span>
            <span className="text-muted-foreground">/month</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
              <span>1,000 requests/hour</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
              <span>Full access to trial data</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
              <span>Complete outcome labels</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
              <span>Email support</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
              <span>Comparative effectiveness data</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Subscribe</Button>
        </CardFooter>
      </Card>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>Enterprise</CardTitle>
          <CardDescription>For large organizations and healthcare systems</CardDescription>
          <div className="mt-4">
            <span className="text-3xl font-bold">Custom</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
              <span>Custom request limits</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
              <span>Premium data access</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
              <span>Advanced analytics</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
              <span>Dedicated support</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
              <span>SLA guarantees</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronDown className="h-5 w-5 text-primary shrink-0 rotate-[-90deg]" />
              <span>Custom integrations</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full">
            Contact Sales
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
} 