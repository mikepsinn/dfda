"use server";
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/database.types';
import { logger } from '@/lib/logger';

export type NotificationInsert = Database['public']['Tables']['notifications']['Insert'];
export type Notification = Database['public']['Tables']['notifications']['Row'];

// Add action functions here later if needed 