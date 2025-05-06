"use client"

import { useState, useTransition, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { logger } from "@/lib/logger"
import { updateProfileAction } from "@/lib/actions/profiles"
import type { Profile, ProfileUpdate } from "@/lib/actions/profiles"

interface ProfileFormProps {
  initialData: Profile | Partial<Profile>
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    name: `${initialData?.first_name || ''} ${initialData?.last_name || ''}`.trim(),
    timezone: initialData?.timezone || "",
  })
  const [timezones, setTimezones] = useState<string[]>([])

  useEffect(() => {
    try {
      const supportedTimezones = Intl.supportedValuesOf('timeZone')
      setTimezones(supportedTimezones)
      if (!formData.timezone && supportedTimezones.length > 0) {
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
        if (supportedTimezones.includes(browserTimezone)) {
          setFormData((prev) => ({ ...prev, timezone: browserTimezone }))
        } else {
          setFormData((prev) => ({ ...prev, timezone: supportedTimezones[0] || "UTC" }))
        }
      }
    } catch (error) {
      logger.error("Failed to get supported timezones:", error)
      setTimezones(["UTC"])
      if (!formData.timezone) {
        setFormData((prev) => ({ ...prev, timezone: "UTC" }))
      }
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTimezoneChange = (value: string) => {
    setFormData((prev) => ({ ...prev, timezone: value }))
  }

  const handleFormSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!initialData?.id) {
        logger.error("ProfileForm: Missing user ID for update.")
        toast({ title: "Error", description: "Cannot update profile without user ID.", variant: "destructive" })
        return;
    }
    const userId = initialData.id;

    const [firstName, ...lastNameParts] = formData.name.trim().split(/\s+/);
    const lastName = lastNameParts.join(' ');

    const profileUpdates: ProfileUpdate = {
        first_name: firstName || null,
        last_name: lastName || null,
        timezone: formData.timezone || null,
    };

    startTransition(async () => {
      logger.info("Updating user profile via server action", { userId, updates: profileUpdates });
      try {
        const updatedProfile = await updateProfileAction(userId, profileUpdates)

        if (!updatedProfile) {
          throw new Error("Server action returned null, update likely failed.")
        }

        toast({ title: "Success", description: "Profile updated successfully." })
        router.refresh()
      } catch (error: any) {
        logger.error('Error updating profile via server action', { userId, error })
        toast({ 
          title: "Error", 
          description: error.message || "Failed to update profile.", 
          variant: "destructive" 
        })
      }
    })
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select 
            name="timezone" 
            value={formData.timezone}
            onValueChange={handleTimezoneChange}
            required
          >
            <SelectTrigger id="timezone">
              <SelectValue placeholder="Select timezone..." />
            </SelectTrigger>
            <SelectContent>
              {timezones.length === 0 && <SelectItem value="" disabled>Loading timezones...</SelectItem>}
              {timezones.map((tz) => (
                <SelectItem key={tz} value={tz}>{tz.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Updating..." : "Update Profile"}
      </Button>
    </form>
  )
}

