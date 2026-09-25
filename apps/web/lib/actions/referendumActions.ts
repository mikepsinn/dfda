'use server';

import { redirect } from 'next/navigation';
import { logger } from '@/lib/logger';

export async function submitReferendumVoteAction() {
  // For this temporary referendum, we are logging the vote intent.
  // For a persistent solution, this action should be updated to store
  // the vote in a dedicated database table (e.g., 'referendum_votes').
  logger.info('Referendum vote cast (signature received)', {
    timestamp: new Date().toISOString(),
    referendum_id: 'dfda_support_referendum_01', // Example identifier for this referendum
  });

  // Redirect to a thank-you page
  redirect('/referendum/thank-you');
} 