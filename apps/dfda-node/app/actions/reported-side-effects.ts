"use server";
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';
import { logger } from '@/lib/logger';

export type ReportedSideEffectInsert = Database['public']['Tables']['reported_side_effects']['Insert'];
export type ReportedSideEffect = Database['public']['Tables']['reported_side_effects']['Row'];

// Add action functions here later if needed 