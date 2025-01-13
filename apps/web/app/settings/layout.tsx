import { Metadata } from "next"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { SettingsMobileNav } from "../components/settings/settings-mobile-nav"

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings and preferences.",
}

const sidebarNavItems = [
  {
    title: "Profile",
    href: "/settings",
  },
  {
    title: "Connected Accounts",
    href: "/settings/accounts",
  },
]

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr] py-8">
      <SettingsMobileNav items={sidebarNavItems} />

      {/* Desktop Sidebar */}
      <aside className="hidden w-[200px] flex-col md:flex">
        <nav className="neobrutalist-container grid items-start gap-4">
          {sidebarNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group neobrutalist-button",
                "w-full justify-start text-left font-black"
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex w-full flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
} 