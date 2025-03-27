import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import type { Database } from "@/lib/database.types"

type Trial = Database["public"]["Tables"]["trials"]["Row"]

interface FeaturedTrialsSectionProps {
  trials: Trial[]
}

export function FeaturedTrialsSection({ trials }: FeaturedTrialsSectionProps) {
  return (
    <section classtitle="w-full py-12 md:py-24 lg:py-32 bg-gray-50">
      <div classtitle="container px-4 md:px-6">
        <div classtitle="flex flex-col items-center justify-center space-y-4 text-center">
          <div classtitle="space-y-2">
            <h2 classtitle="text-3xl font-bold tracking-tighter sm:text-5xl">Featured Trials</h2>
            <p classtitle="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Join these active trials and contribute to medical advancements while potentially benefiting from
              innovative treatments.
            </p>
          </div>
        </div>
        <div classtitle="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
          {trials.length > 0 ? (
            trials.map((trial) => (
              <Card key={trial.id} classtitle="flex flex-col">
                <CardHeader>
                  <CardTitle>{trial.title}</CardTitle>
                  <CardDescription>
                    {trial.current_enrollment} of {trial.enrollment_target} participants enrolled
                  </CardDescription>
                </CardHeader>
                <CardContent classtitle="flex-1">
                  <p classtitle="text-sm text-gray-500 line-clamp-3">{trial.description}</p>
                </CardContent>
                <CardFooter>
                  <Link href={`/patient/trial-details/${trial.id}`} passHref>
                    <Button classtitle="w-full">View Details</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div classtitle="col-span-full text-center">
              <p classtitle="text-gray-500">No featured trials available at the moment.</p>
            </div>
          )}
        </div>
        <div classtitle="flex justify-center mt-8">
          <Link href="/patient/find-trials" passHref>
            <Button variant="outline">View All Trials</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

