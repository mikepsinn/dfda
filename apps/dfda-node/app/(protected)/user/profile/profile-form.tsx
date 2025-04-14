"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "@/components/ui/use-toast"
import { logger } from "@/lib/logger"

interface ProfileFormProps {
  initialData: any
}

export function ProfileForm({ initialData }: ProfileFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    phone: initialData?.phone || "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    logger.info("Updating user profile", { userId: initialData.id })

    try {
      const supabase = createClient()

      const [firstName, ...lastNameParts] = formData.name.split(' ');
      const lastName = lastNameParts.join(' ');

      // First, update the auth user's metadata if needed (optional, depends on your setup)
      // const { error: authError } = await supabase.auth.updateUser({
      //   data: { 
      //     first_name: firstName, // Use split name
      //     last_name: lastName, // Use split name
      //   }
      // })
      // if (authError) throw authError

      // Then, update the profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName, // Use split name
          last_name: lastName, // Use split name
          phone: formData.phone || null,
        })
        .eq("id", initialData.id)

      if (profileError) throw profileError

      toast({ title: "Success", description: "Profile updated successfully." })
      router.refresh()
    } catch (error: any) {
      logger.error('Error updating profile', { userId: initialData.id, error })
      setError(error.message || "An unexpected error occurred.")
      toast({ title: "Error", description: error.message || "Failed to update profile.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} type="tel" />
          </div>
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Changes"}
      </Button>
    </form>
  )
}

