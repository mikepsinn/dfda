import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"

import { authOptions } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Profile Settings",
  description: "Manage your profile settings and preferences",
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect("/signin?callbackUrl=/settings")
  }

  return (
    <div className="neobrutalist-container">
      <div className="neobrutalist-gradient-container neobrutalist-gradient-green mb-8">
        <h3 className="neobrutalist-title text-white mb-2">Profile</h3>
        <p className="neobrutalist-description text-white/80">
          Manage your profile settings
        </p>
      </div>

      <div className="space-y-6">
        <div className="neobrutalist-gradient-container bg-gradient-to-r from-[#6633FF] to-[#0066FF]">
          <div className="space-y-4">
            <div>
              <div className="text-sm font-black text-white mb-1">Email</div>
              <div className="text-sm font-bold text-white/80">
                {session.user.email}
              </div>
            </div>
            <div>
              <div className="text-sm font-black text-white mb-1">Name</div>
              <div className="text-sm font-bold text-white/80">
                {session.user.name}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 