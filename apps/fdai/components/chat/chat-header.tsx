import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"

export function ChatHeader() {
  return (
    <header className="flex items-center justify-between border-b p-4 h-16 dark:border-gray-800">
      <div className="flex items-center">
        <SidebarTrigger className="mr-4" />
        <h1 className="text-xl font-semibold">FDAi Health Insights</h1>
      </div>
      <ThemeToggle />
    </header>
  )
}
