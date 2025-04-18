"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { logger } from "@/lib/logger"
import { updateProfileAction } from "@/lib/actions/profiles"
import type { Profile, ProfileUpdate } from "@/lib/profile"

interface ProfileFormProps {
  initialData: Profile | Partial<Profile>
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    name: `${initialData?.first_name || ''} ${initialData?.last_name || ''}`.trim(),
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
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
    };

    startTransition(async () => {
      logger.info("Updating user profile via server action", { userId });
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
      </div>

      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  )
}

