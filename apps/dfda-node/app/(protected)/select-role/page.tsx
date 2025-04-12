import { redirect } from 'next/navigation'
import { getServerUser } from "@/lib/server-auth"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Briefcase, Code } from 'lucide-react' // Icons for roles

// Server Action to set user role
async function setUserRole(role: string) {
  'use server'

  const supabase = await createClient()
  const user = await getServerUser()

  if (!user) {
    return redirect('/login')
  }

  logger.info('Setting user role', { userId: user.id, role });

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ user_type: role })
      .eq('id', user.id)
      .select('user_type') // Select to confirm update
      .single()

    if (error) {
      logger.error('Error setting user role:', error)
      // TODO: Add user-facing error handling
      return // Stay on page if error
    } else {
      logger.info('User role set successfully', { userId: user.id, role });
      // Redirect based on newly set role
      const redirectPath = 
        role === 'patient' ? '/patient/profile' : // Go to profile first
        role === 'research-partner' ? '/research-partner/profile' : // Go to profile first
        role === 'developer' ? '/developer' :
        '/login'; // Fallback
      redirect(redirectPath)
    }
  } catch (err) {
    logger.error('Unexpected error setting user role:', err)
    // TODO: Add user-facing error handling
  }
}

export default async function SelectRolePage() {
  const user = await getServerUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user already has a role
  const supabase = await createClient()
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  if (profileError) {
    logger.error('Error fetching user profile for role check:', profileError)
    // Don't redirect, allow role selection as fallback
  }

  // If role exists, redirect to appropriate dashboard/profile
  if (profile?.user_type) {
    logger.info('User already has role, redirecting', { userId: user.id, role: profile.user_type });
    const redirectPath = 
      profile.user_type === 'patient' ? '/patient/profile' :
      profile.user_type === 'research-partner' ? '/research-partner/profile' :
      profile.user_type === 'developer' ? '/developer' :
      '/'; // Fallback to homepage or a generic dashboard
    redirect(redirectPath)
  }

  // If no role, show selection options
  logger.info('User has no role, showing selection page', { userId: user.id });

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4 md:p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Select Your Role</CardTitle>
          <CardDescription>Choose how you will use the platform.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Server Action Forms for Role Selection */}
          <form action={() => setUserRole('patient')}>
            <Button type="submit" className="w-full justify-start" variant="outline">
              <User className="mr-2 h-4 w-4" />
              I am a Patient
            </Button>
          </form>
          <form action={() => setUserRole('research-partner')}>
            <Button type="submit" className="w-full justify-start" variant="outline">
              <Briefcase className="mr-2 h-4 w-4" />
              I am a Research Partner / Sponsor
            </Button>
          </form>
          <form action={() => setUserRole('developer')}>
            <Button type="submit" className="w-full justify-start" variant="outline">
              <Code className="mr-2 h-4 w-4" />
              I am a Developer
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
} 