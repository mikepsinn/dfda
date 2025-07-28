import { GoalsManager } from "@/components/goals/goals-manager"
import { getServerUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function GoalsPage() {
  const user = await getServerUser()

  if (!user) {
    redirect("/auth")
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Manage Your Health Goals</h1>
      <p className="text-muted-foreground mb-8">
        Your health goals help us provide personalized insights about how your diet, medications, and lifestyle affect
        your health outcomes.
      </p>

      <GoalsManager userId={user.id} />
    </div>
  )
}
