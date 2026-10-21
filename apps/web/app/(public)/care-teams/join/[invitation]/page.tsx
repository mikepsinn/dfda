import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { acceptInvitationAction } from "@/lib/actions/care-team"
import { invitationsFor } from "@/lib/care-team/data"
import { getServerUser } from "@/lib/server-auth"

export const metadata: Metadata = { title: "Care team invitation" }

/** An invitation to a care team: the invited person joins here after they sign in with the invited email. */
export default async function JoinCareTeamPage({ params }: { params: Promise<{ invitation: string }> }) {
  const { invitation: invitationId } = await params
  const user = await getServerUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/care-teams/join/${invitationId}`)}`)
  const invitation = (await invitationsFor(user)).find((row) => row.id === invitationId)

  if (!invitation) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">This invitation is not open</h1>
        <p>
          You are signed in as <span className="font-medium">{user.email}</span>. The invitation is for another email, or
          it is cancelled or already used.
        </p>
        <p className="text-muted-foreground">
          Sign out, open the link again and sign in with the email that got the invitation. Or ask the clinic for a new
          invitation.
        </p>
        <Link href="/instances" className="inline-block font-medium text-primary underline">
          Your instances and care teams
        </Link>
      </div>
    )
  }

  const name = invitation.instance.name
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <p className="text-sm font-medium text-primary">Care team invitation</p>
      <h1 className="text-3xl font-bold tracking-tight">Join the {name} care team</h1>
      <p>
        On the care team you see the people who share their biomarker reports with {name}. You add their reports and
        sign them off. Each person chooses to share, and can stop at any time.
      </p>
      <form action={acceptInvitationAction.bind(null, invitation.id)}>
        <Button type="submit">Join the care team</Button>
      </form>
    </div>
  )
}
