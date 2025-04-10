import { ResearchPartnerHowItWorks } from "@/components/how-it-works/ResearchPartnerHowItWorks"

export default function ResearchPartnerPage() {
  return (
    <main className="flex-1">
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
            <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium">
              <span className="text-primary">Simple & Streamlined Process</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              Treat Patients and Fund Your Trial
            </h2>
            <p className="max-w-[85%] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Create and manage trials with our intuitive, streamlined process
            </p>
          </div>

          <ResearchPartnerHowItWorks />
        </div>
      </section>

      <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
        <div className="container px-4 md:px-6">
          <div className="mx-auto grid max-w-5xl items-center gap-6 lg:grid-cols-2 lg:gap-12">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Benefits for Research Partners</h2>
              <p className="text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                The Decentralized FDA platform offers unprecedented advantages for trial research partners
              </p>
            </div>
            <div className="grid gap-6">
              <div className="grid gap-1">
                <h3 className="text-xl font-bold">Broader Patient Access</h3>
                <p className="text-gray-500">
                  Reach patients regardless of geographic location, increasing diversity and representation
                </p>
              </div>
              <div className="grid gap-1">
                <h3 className="text-xl font-bold">Reduced Costs</h3>
                <p className="text-gray-500">Eliminate expensive site management and streamline patient recruitment</p>
              </div>
              <div className="grid gap-1">
                <h3 className="text-xl font-bold">Real-World Data</h3>
                <p className="text-gray-500">
                  Collect comprehensive real-world evidence on treatment efficacy and safety
                </p>
              </div>
              <div className="grid gap-1">
                <h3 className="text-xl font-bold">Faster Time to Market</h3>
                <p className="text-gray-500">
                  Accelerate the approval process with streamlined data collection and analysis
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

