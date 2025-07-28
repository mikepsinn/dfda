'use server';

import { z } from 'zod';
import { createServerClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
import { type Database } from '@/lib/database.types';

const UpdateProfileSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50, 'First name must be 50 characters or less').optional().or(z.literal('')),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name must be 50 characters or less').optional().or(z.literal('')),
  // We don't update email here as it's typically handled separately due to verification needs
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

type ProfileUpdate = Partial<Pick<Database['public']['Tables']['profiles']['Row'], 'first_name' | 'last_name'>>;


export async function updateDeveloperProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<{ success: boolean; data?: null; error?: string; details?: any }> {
  const supabase = await createServerClient();

  const validatedFields = UpdateProfileSchema.safeParse(input);

  if (!validatedFields.success) {
    logger.error('Invalid input for updateDeveloperProfile', { error: validatedFields.error.flatten().fieldErrors });
    return {
      success: false,
      error: 'Invalid input.',
      details: validatedFields.error.flatten().fieldErrors,
    };
  }

  const profileDataToUpdate: ProfileUpdate = {};
  if (validatedFields.data.first_name) {
    profileDataToUpdate.first_name = validatedFields.data.first_name;
  }
  if (validatedFields.data.last_name) {
    profileDataToUpdate.last_name = validatedFields.data.last_name;
  }
  
  if (Object.keys(profileDataToUpdate).length === 0) {
    return {
        success: true, // No actual update needed, but not an error
        data: null,
        error: "No changes provided to update." 
    };
  }

  try {
    const { error } = await supabase
      .from('profiles')
      .update(profileDataToUpdate)
      .eq('id', userId);

    if (error) {
      logger.error('Error updating profile in Supabase', { userId, error });
      return { success: false, error: error.message, details: error };
    }

    revalidatePath('/developer/dashboard'); // Or the specific path where the profile is displayed
    return { success: true, data: null };
  } catch (e: any) {
    logger.error('Unexpected error in updateDeveloperProfile', { userId, error: e });
    return { success: false, error: 'An unexpected error occurred.', details: e.toString() };
  }
} 