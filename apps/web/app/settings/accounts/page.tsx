import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"

import { authOptions } from "@/lib/auth"
import { ConnectedAccounts } from "../../components/user/connected-accounts"

export const metadata: Metadata = {
  title: "Connected Accounts",
  description: "Manage your connected accounts and integrations",
}

export default async function ConnectedAccountsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/signin?callbackUrl=/settings/accounts")
  }

  return (
    <div className="neobrutalist-container">
      <div className="neobrutalist-gradient-container neobrutalist-gradient-pink mb-8">
        <h3 className="neobrutalist-title text-white mb-2">Connected Accounts</h3>
        <p className="neobrutalist-description text-white/80">
          Connect and manage your external accounts
        </p>
      </div>
      <ConnectedAccounts />
    </div>
  )
} 