import { FindTrialsForm } from "./components/find-trials-form"

export default function FindTrialsPage() {
  return (
    <div className="container max-w-2xl py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Find Clinical Trials</h1>
        <p className="text-muted-foreground">
          Search for clinical trials by medical condition
        </p>
      </div>
      <FindTrialsForm />
    </div>
  )
} 