import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Microscope, FileText } from "lucide-react"

interface DashboardHeaderProps {
  title: string
  description: string
}

export function DashboardHeader({ title, description }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="flex gap-2">
        <Link href="/doctor/find-trials">
          <Button>
            <Microscope className="mr-2 h-4 w-4" />
            Find Trials
          </Button>
        </Link>
        <Link href="/doctor/form-management/create">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Create Form
          </Button>
        </Link>
      </div>
    </div>
  )
}

