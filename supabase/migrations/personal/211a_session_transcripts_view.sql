-- Checkin Session Transcripts View
--
-- Provides a consolidated view of check-in session communications with all messages
-- Useful for displaying complete conversation histories
--
CREATE VIEW personal.checkin_session_transcripts AS
SELECT 
    cs.id as session_id,
    cs.user_id,
    cs.schedule_id,
    cs.channel,
    cs.session_start,
    cs.session_end,
    cs.ai_agent_id,
    json_agg(
        json_build_object(
            'message_id', cm.id,
            'message_type', cm.message_type,
            'content', cm.content,
            'sent_at', cm.sent_at,
            'delivered_at', cm.delivered_at,
            'read_at', cm.read_at,
            'metadata', cm.metadata
        ) ORDER BY cm.sent_at
    ) as transcript
FROM personal.check_in_sessions cs
LEFT JOIN personal.communication_messages cm ON cs.id = cm.session_id
GROUP BY cs.id, cs.user_id, cs.schedule_id, cs.channel, cs.session_start, cs.session_end, cs.ai_agent_id; 