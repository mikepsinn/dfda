import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getServerUser } from "@/lib/server-auth"
import { createClient } from "@/lib/supabase/server"
import { redirect } from 'next/navigation'
import { logger } from "@/lib/logger"

// Server Action to update research partner profile
async function updateResearchPartnerProfile(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const user = await getServerUser()

  if (!user) {
    return redirect('/login')
  }

  const contactName = formData.get('contact-name') as string

  try {
    // Update profiles table (only first/last name from contact person)
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        first_name: contactName.split(' ')[0] || '', 
        last_name: contactName.split(' ').slice(1).join(' ') || '' 
      })
      .eq('id', user.id)

    if (profileError) {
      logger.error('Error updating research partner profile (profiles table):', profileError)
      // TODO: Add user-facing error handling
      throw profileError
    } else {
      logger.info('Research partner profile name updated successfully for user:', user.id)
    }

    // Removed upsert to non-existent 'research_partners' table
    // TODO: Add logic here when research_partners table/columns are created
    /*
    const { error: partnerError } = await supabase
      .from('research_partners') // This table doesn't exist
      .upsert({ 
        id: user.id, 
        // organization_name: organizationName, 
        // organization_type: organizationType 
       }, {
        onConflict: 'id' 
       })

    if (partnerError) {
      logger.error('Error updating research partner profile (research_partners table):', partnerError)
      // TODO: Add user-facing error handling
    } else {
      logger.info('Research partner profile updated successfully for user:', user.id)
      // Optionally revalidate path or redirect
    }
    */
  } catch (err) {
    logger.error('Unexpected error updating research partner profile:', err)
    // TODO: Add user-facing error handling
  }
}

export default async function ResearchPartnerProfilePage() {
  const user = await getServerUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch existing profile data only
  const supabase = await createClient()
  const { data: profileData, error: fetchError } = await supabase
    .from('profiles')
    .select('first_name, last_name, email') // Removed research_partners join
    .eq('id', user.id)
    .single()

  if (fetchError) {
    logger.error('Error fetching research partner profile data:', fetchError)
    // Handle error appropriately
  }

  // Removed logic for non-existent partnerInfo
  // const partnerInfo = ...
  const contactName = `${profileData?.first_name || ''} ${profileData?.last_name || ''}`.trim()

  return (
    <main className="py-6 md:py-10">
      <div className="container">
        <div className="mx-auto max-w-2xl space-y-8">
          <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl">Research Partner Profile</h1>
          <p className="text-muted-foreground">Update your contact information.</p>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>Provide details about the primary contact.</CardDescription>
            </CardHeader>
            <CardContent>
              <form action={updateResearchPartnerProfile} className="space-y-4">
                <div className="space-y-2">
                   <Label htmlFor="contact-name">Contact Person</Label>
                   <Input id="contact-name" name="contact-name" required defaultValue={contactName} />
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