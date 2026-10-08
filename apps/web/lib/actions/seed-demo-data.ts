"use server";

import type { adminDb } from "@/lib/db";
import { logger } from "@/lib/logger";
import { DEMO_ACCOUNTS, DemoUserType } from "@/lib/constants/demo-accounts";

// The full-access client (adminDb). Callers pass it in; a browser cannot, so client code cannot run this server action.
type AdminDb = typeof adminDb;

// Seed data holds ISO date strings; Prisma needs Date objects for date and timestamp columns.
function toDate(value: string | Date | null | undefined) {
  return typeof value === 'string' ? new Date(value) : value;
}

// Helper function to clear existing demo data for a user
async function clearExistingDemoData(db: AdminDb, userId: string, userType: DemoUserType) {
  logger.info("Clearing existing demo data for user", { userId, userType });

  // Order matters due to foreign keys

  // Data linked to patients or general users
  await db.data_submissions.deleteMany({ where: { patient_id: userId } });
  await db.trial_enrollments.deleteMany({ where: { patient_id: userId } });
  await db.patient_conditions.deleteMany({ where: { patient_id: userId } });
  // IMPORTANT: Don't delete the patients record here if the trigger creates it.
  // Instead, we will upsert patient details later.
  await db.treatment_ratings.deleteMany({ where: { patient_treatments: { patient_id: userId } } });
  await db.patient_side_effects.deleteMany({ where: { patient_treatments: { patient_id: userId } } });
  await db.notifications.deleteMany({ where: { user_id: userId } });

  // Data linked to providers
  if (userType === 'provider') {
      await db.trial_enrollments.deleteMany({ where: { provider_id: userId } });
  }

  // Data linked to research partners (Trials)
  if (userType === 'research-partner') {
      await db.trials.deleteMany({ where: { research_partner_id: userId } });
  }

  // Profile is handled by upsert in demoLogin
}

// Main function to seed data for a specific demo user
export async function setupDemoUserData(
  db: AdminDb,
  userId: string,
  userType: DemoUserType
) {
  const account = DEMO_ACCOUNTS[userType];
  const seedData = account.seedData as any;

  if (!seedData || Object.keys(seedData).length === 0) {
    logger.info("No specific seed data defined for user type", { userId, userType });
    return;
  }

  logger.info("Setting up demo data for user", { userId, userType });

  try {
    await clearExistingDemoData(db, userId, userType);

    // --- Seed Research Partner Specific Data ---
    if (userType === 'research-partner' && seedData.trialsToSeed) {
        logger.info("Seeding trials", { userId, count: seedData.trialsToSeed.length });
        const trialsToInsert = seedData.trialsToSeed.map((trial: any) => ({
            ...trial,
            start_date: toDate(trial.start_date),
            end_date: toDate(trial.end_date),
            research_partner_id: userId
        }));
        // Use upsert for trials to be safe
        for (const trial of trialsToInsert) {
            await db.trials.upsert({ where: { id: trial.id }, create: trial, update: trial });
        }
    }

    // --- Seed Patient Specific Data ---
    if (userType === 'patient' && seedData.patientDetails) {
      logger.info("Upserting patient details", { userId });
      const patientDetails = {
          ...seedData.patientDetails,
          date_of_birth: toDate(seedData.patientDetails.date_of_birth),
          id: userId,
      };
      await db.patients.upsert({ where: { id: userId }, create: patientDetails, update: patientDetails });

      if (seedData.conditions && seedData.conditions.length > 0) {
        logger.info("Seeding patient conditions", { userId, count: seedData.conditions.length });
        const conditionsToInsert = seedData.conditions.map((cond: any) => ({
            ...cond,
            diagnosed_at: toDate(cond.diagnosed_at),
            patient_id: userId,
        }));
        // Use upsert for conditions? Check if needed based on constraints.
        await db.patient_conditions.createMany({ data: conditionsToInsert });
      }

      const createdEnrollmentIds: { [trialId: string]: string } = {};
      if (seedData.enrollments && seedData.enrollments.length > 0) {
        logger.info("Seeding trial enrollments", { userId, count: seedData.enrollments.length });
        const enrollmentsToInsert = seedData.enrollments.map((enr: any) => ({
            ...enr,
            enrollment_date: toDate(enr.enrollment_date),
            completion_date: toDate(enr.completion_date),
            patient_id: userId,
        }));
        const enrollmentData = await db.trial_enrollments.createManyAndReturn({
            data: enrollmentsToInsert,
            select: { id: true, trial_id: true },
        });
        enrollmentData.forEach(e => { createdEnrollmentIds[e.trial_id] = e.id; });
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
                // Destructure and ignore trial_id_for_linking using underscore prefix and disable lint rule
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { trial_id_for_linking: _ignored_trial_id, ...rest } = sub;
                return {
                    ...rest,
                    submission_date: toDate(rest.submission_date),
                    review_date: toDate(rest.review_date),
                    patient_id: userId,
                    enrollment_id,
                };
            })
            .filter((sub: any) => sub !== null);

        if (submissionsToInsert.length > 0) {
            await db.data_submissions.createMany({ data: submissionsToInsert });
        }
      }

      if (seedData.ratings && seedData.ratings.length > 0) {
         logger.info("Seeding treatment ratings", { userId, count: seedData.ratings.length });
         const ratingsToInsert = seedData.ratings.map((r: any) => ({ ...r, user_id: userId }));
         await db.treatment_ratings.createMany({ data: ratingsToInsert });
      }

      if (seedData.sideEffects && seedData.sideEffects.length > 0) {
          logger.info("Seeding side effects", { userId, count: seedData.sideEffects.length });
          const sideEffectsToInsert = seedData.sideEffects.map((se: any) => ({ ...se, user_id: userId }));
          await db.patient_side_effects.createMany({ data: sideEffectsToInsert });
      }
    }

    // --- Seed General User Data (like Notifications) ---
    if (seedData.notifications && seedData.notifications.length > 0) {
      logger.info("Seeding notifications", { userId, count: seedData.notifications.length });
      const notificationsToInsert = seedData.notifications.map((n: any) => ({
          ...n,
          read_at: toDate(n.read_at),
          user_id: userId,
      }));
      await db.notifications.createMany({ data: notificationsToInsert });
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
