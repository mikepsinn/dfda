import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getServerUser } from "@/lib/server-auth"
import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { logger } from "@/lib/logger"
import { ProfileForm } from '../user/profile/profile-form';

// Server Action to update patient profile
async function updatePatientProfile(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const user = await getServerUser()

  if (!user) {
    return redirect('/login')
  }

  const firstName = formData.get('first-name') as string
  const lastName = formData.get('last-name') as string

  try {
    // Update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ first_name: firstName, last_name: lastName })
      .eq('id', user.id)

    if (profileError) {
      logger.error('Error updating patient profile (profiles table):', profileError)
      throw profileError // Re-throw to handle below
    } else {
       logger.info('Patient profile name updated successfully for user:', user.id)
    }

    // TODO: Determine how/where to store health condition info (e.g., patient_conditions table)
  } catch (err) {
    logger.error('Unexpected error updating patient profile:', err)
    // TODO: Add user-facing error handling
  }
}

export default async function PatientProfilePage() {
  const user = await getServerUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch existing profile data
  const supabase = await createClient()
  const { data: profileData, error: profileFetchError } = await supabase
    .from('profiles')
    .select('first_name, last_name, email')
    .eq('id', user.id)
    .single()

  if (profileFetchError) {
    logger.error('Error fetching patient profile data:', profileFetchError)
    // Handle error appropriately
  }

  return (
    <main className="py-6 md:py-10">
      <div className="container">
        <div className="mx-auto max-w-2xl space-y-8">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Profile</h1>

          <Card>
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
              <CardDescription>Please provide some basic information about yourself.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updatePatientProfile} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <Label htmlFor="first-name">First name</Label>
                     <Input id="first-name" name="first-name" required defaultValue={profileData?.first_name ?? ''} />
                   </div>
                   <div className="space-y-2">
                     <Label htmlFor="last-name">Last name</Label>
                     <Input id="last-name" name="last-name" required defaultValue={profileData?.last_name ?? ''} />
                   </div>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" value={profileData?.email ?? ''} readOnly />
                 </div>
                 <Button type="submit">Update Profile</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
} 