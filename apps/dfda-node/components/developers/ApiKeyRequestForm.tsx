import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function ApiKeyRequestForm() {
  return (
    <form className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="first-name">First name</Label>
          <Input id="first-name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last-name">Last name</Label>
          <Input id="last-name" required />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="organization">Organization</Label>
        <Input id="organization" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="use-case">How will you use the API?</Label>
        <Textarea id="use-case" className="min-h-[100px]" required />
      </div>
      <Button type="submit">Request API Key</Button>
    </form>
  )
}

