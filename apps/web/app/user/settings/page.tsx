'use server';

// import { createClient } from "@/utils/supabase/server"; // Use getServerUser instead
import { getServerUser } from "@/lib/server-auth"; // Import the helper
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { logger } from "@/lib/logger";

// Import the new/existing components
import ChangePasswordForm from "@/components/settings/change-password-form";
import MfaSettings from "@/components/settings/mfa-settings";
import { ThemeToggle } from "@/components/ThemeToggle";

// TODO: Implement actual settings components (Password Change, MFA, etc.)
// import ChangePasswordForm from "./change-password-form";

export default async function SettingsPage() {
  // const supabase = createClient(); // Remove direct client creation

  // Use the helper function to get the user
  const user = await getServerUser();

  // Check if user is null (not logged in)
  if (!user) { 
    logger.info("[SettingsPage] User not logged in, redirecting to login.");
    redirect("/login?message=Please log in to access settings.");
  }

  // No need for data/error destructuring anymore if just checking for user existence
  // if (error || !data?.user) {
  //   logger.info("[SettingsPage] User not logged in, redirecting to login.");
  //   redirect("/login?message=Please log in to access settings.");
  // }

  // Log using the user object obtained from the helper
  logger.info(`[SettingsPage] User ${user.id} accessed settings page.`);

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

      <div className="grid gap-6 md:grid-cols-1">
        {/* General Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Manage general account settings.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for future general settings */}
            <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Appearance</span>
                <ThemeToggle />
            </div>
            {/* Add Language settings here if needed */}
          </CardContent>
        </Card>

        {/* Security Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Manage your account security settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-base font-medium mb-2">Change Password</h3>
              <ChangePasswordForm />
            </div>
            <Separator />
             <div>
              <h3 className="text-base font-medium mb-2">Two-Factor Authentication (2FA)</h3>
              <MfaSettings />
            </div>
          </CardContent>
        </Card>

        {/* Add more setting categories as needed */}
        {/* Example: Notifications Card */}
        {/* 
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage your notification preferences.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Notification settings options will appear here.
            </p>
          </CardContent>
        </Card>
        */}

      </div>
    </div>
  );
} 