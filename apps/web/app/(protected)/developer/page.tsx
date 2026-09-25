import { getServerUser } from "@/lib/server-auth";
import { getUserProfile } from "@/lib/profile";
import { redirect } from 'next/navigation';
import { logger } from "@/lib/logger"; // Assuming logger is used below
import { DeveloperDashboardClient } from "@/components/developers/DeveloperDashboardClient"; // Import the client component
import { type Database } from "@/lib/database.types";
import FloatingChatButton from "@/components/ui/FloatingChatButton"; // Import the new chat button

// Derive Profile type (can also be done in the client component and imported)
type Profile = Database['public']['Tables']['profiles']['Row'];

// Server Action - moved outside client component, keep definition accessible if needed
// or preferably move to a dedicated actions file.
// async function updateDeveloperProfileAction(userId: string, formData: FormData) {
//   'use server'
// ... action logic ...
// }

export default async function DeveloperDashboardPage() {
  const user = await getServerUser()
  if (!user) {
    redirect('/login')
  }

  const profile: Profile | null = await getUserProfile(user);
  if (!profile) {
    logger.error('Error fetching developer profile via helper', { userId: user.id })
    // Handle error or maybe proceed with null profile
  }

  // Render ONLY the client component, passing server data as props
  return (
    <>
      <DeveloperDashboardClient 
          user={user} 
          profile={profile} 
      />
      <FloatingChatButton />
    </>
  );
}
