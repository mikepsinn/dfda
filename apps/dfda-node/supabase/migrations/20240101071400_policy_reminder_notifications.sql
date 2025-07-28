-- Policies for reminder_notifications table

-- Allow users to see their own notifications
CREATE POLICY select_own_reminder_notifications
  ON reminder_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to update the status (and related fields) of their own pending notifications
CREATE POLICY update_own_pending_reminder_notifications
  ON reminder_notifications
  FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id);
  -- Note: We only allow updating PENDING notifications.
  -- The CHECK clause ensures they cannot change the user_id.

-- Do not allow direct insert (should be handled by background job/trigger)
-- CREATE POLICY insert_own_reminder_notifications
--   ON reminder_notifications
--   FOR INSERT
--   WITH CHECK (auth.uid() = user_id);

-- Do not allow direct delete (use status or soft delete if needed)
-- CREATE POLICY delete_own_reminder_notifications
--   ON reminder_notifications
--   FOR DELETE
--   USING (auth.uid() = user_id); 