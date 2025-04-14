import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { ProviderHowItWorks } from "@/components/how-it-works/ProviderHowItWorks"

export default function PublicProviderPage() {
  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gradient-to-br from-primary/10 to-background">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Accelerate Research and Get Your Patients the Most Promising Treatment
                </h1>
                <p className="text-muted-foreground md:text-xl">
                  With our pragmatic trial methodology, you can get your patients the most promising treatment faster.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button asChild size="lg">
                  <Link href="/auth/signup?role=provider">
                    Get Started Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="#how-it-works-provider">
                    Learn How it Works
                  </Link>
                </Button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <ProviderHowItWorks />

      {/* Add other marketing sections as needed (e.g., Features, Testimonials) */}

    </div>
  );
} 