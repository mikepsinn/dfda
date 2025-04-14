"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { DEMO_ACCOUNTS, DemoUserType } from "@/lib/constants/demo-accounts";

// Helper function to clear existing demo data for a user
async function clearExistingDemoData(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, userType: DemoUserType) {
  logger.info("Clearing existing demo data for user", { userId, userType });

  // Order matters due to foreign keys

  // Data linked to patients or general users
  await supabase.from('data_submissions').delete().eq('patient_id', userId);
  await supabase.from('trial_enrollments').delete().eq('patient_id', userId);
  await supabase.from('patient_conditions').delete().eq('patient_id', userId);
  // IMPORTANT: Don't delete the patients record here if the trigger creates it.
  // await supabase.from('patients').delete().eq('id', userId); 
  // Instead, we will upsert patient details later.
  await supabase.from('treatment_ratings').delete().eq('user_id', userId);
  await supabase.from('reported_side_effects').delete().eq('user_id', userId);
  await supabase.from('notifications').delete().eq('user_id', userId);
  
  // Data linked to providers
  if (userType === 'provider') {
      await supabase.from('trial_enrollments').delete().eq('provider_id', userId); 
  }

  // Data linked to research partners (Trials)
  if (userType === 'research-partner') {
      await supabase.from('trials').delete().eq('research_partner_id', userId);
  }

  // Profile is handled by upsert in demoLogin
}

// Main function to seed data for a specific demo user
export async function setupDemoUserData(userId: string, userType: DemoUserType) {
  const supabase = await createClient();
  const account = DEMO_ACCOUNTS[userType];
  const seedData = account.seedData as any; 

  if (!seedData || Object.keys(seedData).length === 0) {
    logger.info("No specific seed data defined for user type", { userId, userType });
    return; 
  }

  logger.info("Setting up demo data for user", { userId, userType });

  try {
    await clearExistingDemoData(supabase, userId, userType);

    // --- Seed Research Partner Specific Data ---
    if (userType === 'research-partner' && seedData.trialsToSeed) {
        logger.info("Seeding trials", { userId, count: seedData.trialsToSeed.length });
        const trialsToInsert = seedData.trialsToSeed.map((trial: any) => ({ 
            ...trial, 
            research_partner_id: userId 
        }));
        // Use upsert for trials to be safe
        const { error: trialError } = await supabase.from('trials').upsert(trialsToInsert);
        if (trialError) throw new Error(`Trial seeding failed: ${trialError.message}`);
    }

    // --- Seed Patient Specific Data ---
    if (userType === 'patient' && seedData.patientDetails) {
      logger.info("Upserting patient details", { userId });
      // Use upsert since the trigger might have created the basic row
      const { error: patientError } = await supabase.from('patients').upsert({ 
          id: userId, 
          ...seedData.patientDetails 
      });
      if (patientError) throw new Error(`Patient details seeding failed: ${patientError.message}`);

      if (seedData.conditions && seedData.conditions.length > 0) {
        logger.info("Seeding patient conditions", { userId, count: seedData.conditions.length });
        const conditionsToInsert = seedData.conditions.map((cond: any) => ({ ...cond, patient_id: userId }));
        // Use upsert for conditions? Check if needed based on constraints.
        const { error: conditionError } = await supabase.from('patient_conditions').insert(conditionsToInsert);
        if (conditionError) throw new Error(`Patient conditions seeding failed: ${conditionError.message}`);
      }

      const createdEnrollmentIds: { [trialId: string]: string } = {};
      if (seedData.enrollments && seedData.enrollments.length > 0) {
        logger.info("Seeding trial enrollments", { userId, count: seedData.enrollments.length });
        const enrollmentsToInsert = seedData.enrollments.map((enr: any) => ({ ...enr, patient_id: userId }));
        const { data: enrollmentData, error: enrollmentError } = await supabase.from('trial_enrollments').upsert(enrollmentsToInsert).select('id, trial_id');
        if (enrollmentError) throw new Error(`Trial enrollments seeding failed: ${enrollmentError.message}`);
        enrollmentData?.forEach(e => { if(e.trial_id) createdEnrollmentIds[e.trial_id] = e.id; });
      }

      if (seedData.submissions && seedData.submissions.length > 0) {
        logger.info("Seeding data submissions", { userId, count: seedData.submissions.length });
        const submissionsToInsert = seedData.submissions
            .map((sub: any) => {
                const enrollment_id = createdEnrollmentIds[sub.trial_id_for_linking];
                if (!enrollment_id) {
                    logger.warn("Could not find enrollment ID for submission link", { trialId: sub.trial_id_for_linking });
                    return null; 
                }
                // Destructure and ignore trial_id_for_linking using underscore prefix
                const { trial_id_for_linking: _ignored_trial_id, ...rest } = sub;
                return { ...rest, patient_id: userId, enrollment_id };
            })
            .filter((sub: any) => sub !== null); 
        
        if (submissionsToInsert.length > 0) {
            const { error: submissionError } = await supabase.from('data_submissions').insert(submissionsToInsert);
            if (submissionError) throw new Error(`Data submissions seeding failed: ${submissionError.message}`);
        }
      }

      if (seedData.ratings && seedData.ratings.length > 0) {
         logger.info("Seeding treatment ratings", { userId, count: seedData.ratings.length });
         const ratingsToInsert = seedData.ratings.map((r: any) => ({ ...r, user_id: userId }));
         const { error: ratingError } = await supabase.from('treatment_ratings').insert(ratingsToInsert);
         if (ratingError) throw new Error(`Treatment ratings seeding failed: ${ratingError.message}`);
      }

      if (seedData.sideEffects && seedData.sideEffects.length > 0) {
          logger.info("Seeding side effects", { userId, count: seedData.sideEffects.length });
          const sideEffectsToInsert = seedData.sideEffects.map((se: any) => ({ ...se, user_id: userId }));
          const { error: seError } = await supabase.from('reported_side_effects').insert(sideEffectsToInsert);
          if (seError) throw new Error(`Side effects seeding failed: ${seError.message}`);
      }
    }

    // --- Seed General User Data (like Notifications) ---
    if (seedData.notifications && seedData.notifications.length > 0) {
      logger.info("Seeding notifications", { userId, count: seedData.notifications.length });
      const notificationsToInsert = seedData.notifications.map((n: any) => ({ ...n, user_id: userId }));
      const { error: notificationError } = await supabase.from('notifications').insert(notificationsToInsert);
      if (notificationError) throw new Error(`Notifications seeding failed: ${notificationError.message}`);
    }

    logger.info("Demo data setup completed successfully", { userId, userType });

  } catch (error) {
    logger.error("Error setting up demo user data", { 
      userId, 
      userType, 
      error: error instanceof Error ? error.message : String(error)
    });
  }
} 