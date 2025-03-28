import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus } from "lucide-react"

interface SponsorHeaderProps {
  name: string
}

export function SponsorHeader({ name }: SponsorHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Welcome, {name || "Sponsor"}</h1>
      <div className="flex items-center gap-2">
        <Link href="/sponsor/create-trial">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create New Trial
          </Button>
        </Link>
      </div>
    </div>
  )
}
