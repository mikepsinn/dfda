import { redirect } from 'next/navigation'
import { getServerUser } from "@/lib/server-auth"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Briefcase, Code, HelpCircle, Stethoscope } from 'lucide-react'
import type { Database } from "@/lib/database.types"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Separator } from "@/components/ui/separator"

type UserTypeEnum = Database["public"]["Enums"]["user_type_enum"]

// Server Action to set user role
async function setUserType(formData: FormData) {
  'use server'

  const role = formData.get('user_type') as UserTypeEnum
  if (!role) {
    // Handle missing role error
    return; // Just return without redirecting if no role selected
  }

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
      .select('user_type')
      .single()

    if (error) {
      logger.error('Error setting user_type:', error)
      // In a real app, you'd use React's useFormState or other methods to handle errors
      return; // Just return without redirecting if there's an error
    } else {
      logger.info('User role set successfully', { userId: user.id, role });
      redirect(`/${role}`)
    }
  } catch (err) {
    logger.error('Unexpected error setting user role:', err)
    return; // Just return without redirecting on error
  }
}

export default async function SelectRolePage() {
  const user = await getServerUser()

  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  if (profileError) {
    logger.error('Error fetching user profile for role check:', profileError)
  }

  if (profile?.user_type) {
    logger.info('User already has role, redirecting', { userId: user.id, role: profile.user_type });
    redirect(`/${profile.user_type}`)
  }

  logger.info('User has no role, showing selection page', { userId: user.id });

  return (
    <main className="flex items-center justify-center bg-muted/40 p-4 md:p-8">
      <Card className="w-full max-w-md shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-center text-2xl">Select Your Role</CardTitle>
          <CardDescription className="text-center">Choose how you will use the platform.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form action={setUserType}>
            <RadioGroup defaultValue="" name="user_type" className="space-y-3">
              {/* Patient Role */}
              <div className="flex items-start space-x-2 rounded-md border p-4 shadow-sm transition-all hover:bg-accent/30">
                <RadioGroupItem value="patient" id="patient" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="patient" className="font-medium flex items-center cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Patient
                    </Label>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-72">
                        <p className="text-sm">
                          Select this if you are seeking treatment, managing your health information, or looking for clinical trials.
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                </div>
              </div>
              
              {/* Provider Role */}
              <div className="flex items-start space-x-2 rounded-md border p-4 shadow-sm transition-all hover:bg-accent/30">
                <RadioGroupItem value="provider" id="provider" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="provider" className="font-medium flex items-center cursor-pointer">
                      <Stethoscope className="mr-2 h-4 w-4" />
                      Provider
                    </Label>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-72">
                        <p className="text-sm">
                          Select this if you are a healthcare provider, physician, or clinician caring for patients.
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                </div>
              </div>

              {/* Research Partner Role */}
              <div className="flex items-start space-x-2 rounded-md border p-4 shadow-sm transition-all hover:bg-accent/30">
                <RadioGroupItem value="research-partner" id="research-partner" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="research-partner" className="font-medium flex items-center cursor-pointer">
                      <Briefcase className="mr-2 h-4 w-4" />
                      Research Partner / Sponsor
                    </Label>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-72">
                        <p className="text-sm">
                          Select this if you represent an organization conducting research, clinical trials, or analyzing health data.
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                </div>
              </div>

              {/* Developer Role */}
              <div className="flex items-start space-x-2 rounded-md border p-4 shadow-sm transition-all hover:bg-accent/30">
                <RadioGroupItem value="developer" id="developer" className="mt-1" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="developer" className="font-medium flex items-center cursor-pointer">
                      <Code className="mr-2 h-4 w-4" />
                      Developer
                    </Label>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-72">
                        <p className="text-sm">
                          Select this if you want to build applications or integrations using the platform's APIs and tools.
                        </p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                </div>
              </div>
            </RadioGroup>
            
            <Separator className="my-6" />
            
            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
} 