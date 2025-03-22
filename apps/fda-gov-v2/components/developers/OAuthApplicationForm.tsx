import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function OAuthApplicationForm() {
  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="app-name">Application Name</Label>
        <Input id="app-name" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="app-description">Application Description</Label>
        <Textarea id="app-description" className="min-h-[100px]" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="redirect-uri">Redirect URI</Label>
        <Input id="redirect-uri" placeholder="https://your-app.com/callback" required />
      </div>
      <div className="space-y-2">
        <Label>Requested Scopes</Label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="scope-trials-read" className="h-4 w-4 rounded border-gray-300" />
            <Label htmlFor="scope-trials-read" className="text-sm">
              trials:read
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="scope-user-read" className="h-4 w-4 rounded border-gray-300" />
            <Label htmlFor="scope-user-read" className="text-sm">
              user:read
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="scope-user-trials-read" className="h-4 w-4 rounded border-gray-300" />
            <Label htmlFor="scope-user-trials-read" className="text-sm">
              user.trials:read
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="scope-user-trials-write" className="h-4 w-4 rounded border-gray-300" />
            <Label htmlFor="scope-user-trials-write" className="text-sm">
              user.trials:write
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="scope-user-data-read" className="h-4 w-4 rounded border-gray-300" />
            <Label htmlFor="scope-user-data-read" className="text-sm">
              user.data:read
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="scope-user-data-write" className="h-4 w-4 rounded border-gray-300" />
            <Label htmlFor="scope-user-data-write" className="text-sm">
              user.data:write
            </Label>
          </div>
        </div>
      </div>
      <Button type="submit">Register OAuth2 Application</Button>
    </form>
  )
}

