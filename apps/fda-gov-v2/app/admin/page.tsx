import { SeedDatabaseButton } from "@/components/admin/SeedDatabaseButton"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Database Management</CardTitle>
            <CardDescription>Seed the database with initial data for testing and development.</CardDescription>
          </CardHeader>
          <CardContent>
            <SeedDatabaseButton />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

