-- The patient inbox, modeled on QuantiModo's reminder inbox (docs/MIGRATION.md,
-- "Patient app modeled on QuantiModo").

-- Snooze: a pending notification is hidden from the inbox and the due lists
-- until this time. Null when it is not snoozed.
ALTER TABLE public.reminder_notifications ADD COLUMN snoozed_until timestamptz;

-- Favorites: variables a person records as needed from the inbox, with or
-- without a reminder.
ALTER TABLE public.user_variables ADD COLUMN is_favorite boolean NOT NULL DEFAULT false;

-- Undo: a person may put their own answered notification back to pending.
-- update_own_pending_reminder_notifications only allows updates of pending
-- notifications, so undoing a tracked or skipped one changed nothing.
CREATE POLICY revert_own_answered_reminder_notifications
  ON reminder_notifications
  FOR UPDATE
  USING (auth.uid() = user_id AND status IN ('completed', 'skipped'))
  WITH CHECK (auth.uid() = user_id AND status = 'pending');
