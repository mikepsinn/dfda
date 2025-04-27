import { getTreatmentByIdAction } from "@/lib/actions/treatments"
import { Separator } from "@/components/ui/separator"

export default async function TreatmentPage({ params }: { params: { id: string } }) {


  const treatment = await getTreatmentByIdAction(params.id)


  if (!treatment) {
    return <div>Treatment not found.</div>
  }



  return (
    <div className="container mx-auto px-4 py-8">
      <h1>{treatment.name}</h1>
      <Separator className="my-4" />
      <p>{treatment.description}</p>
    </div>
  )
}
