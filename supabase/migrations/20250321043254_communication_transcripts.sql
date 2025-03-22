-- Create tables for storing communication transcripts
CREATE TABLE IF NOT EXISTS medical.communication_messages (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id uuid NOT NULL REFERENCES medical.check_in_sessions(id) ON DELETE CASCADE,
    message_type text NOT NULL CHECK (message_type IN ('system', 'user', 'ai', 'human_agent')),
    content text NOT NULL,
    sent_at timestamptz NOT NULL DEFAULT now(),
    delivered_at timestamptz,
    read_at timestamptz,
    metadata jsonb, -- Store channel-specific metadata (e.g., SMS delivery status, call recording URL)
    parent_message_id uuid REFERENCES medical.communication_messages(id), -- For threaded conversations
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create index for faster transcript retrieval
CREATE INDEX idx_communication_messages_session_time 
    ON medical.communication_messages (session_id, sent_at);

-- Create view for complete session transcripts
CREATE VIEW medical.session_transcripts AS
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
FROM medical.check_in_sessions cs
LEFT JOIN medical.communication_messages cm ON cs.id = cm.session_id
GROUP BY cs.id, cs.user_id, cs.schedule_id, cs.channel, cs.session_start, cs.session_end, cs.ai_agent_id;

-- Add RLS policies
ALTER TABLE medical.communication_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages
CREATE POLICY "Users can view their own messages"
    ON medical.communication_messages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM medical.check_in_sessions cs
        WHERE cs.id = session_id AND cs.user_id = auth.uid()
    ));

-- System can insert messages
CREATE POLICY "System can insert messages"
    ON medical.communication_messages FOR INSERT
    USING (true);

-- Function to add message to session
CREATE OR REPLACE FUNCTION medical.add_session_message(
    p_session_id uuid,
    p_message_type text,
    p_content text,
    p_metadata jsonb DEFAULT NULL,
    p_parent_message_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
    v_message_id uuid;
BEGIN
    INSERT INTO medical.communication_messages (
        session_id,
        message_type,
        content,
        metadata,
        parent_message_id
    ) VALUES (
        p_session_id,
        p_message_type,
        p_content,
        p_metadata,
        p_parent_message_id
    )
    RETURNING id INTO v_message_id;

    -- Update session data with latest message
    UPDATE medical.check_in_sessions
    SET session_data = jsonb_set(
        COALESCE(session_data, '{}'::jsonb),
        '{last_message}',
        jsonb_build_object(
            'id', v_message_id,
            'type', p_message_type,
            'content', p_content,
            'sent_at', CURRENT_TIMESTAMP
        )
    )
    WHERE id = p_session_id;

    RETURN v_message_id;
END;
$$;

-- Function to mark message as delivered
CREATE OR REPLACE FUNCTION medical.mark_message_delivered(
    p_message_id uuid,
    p_delivery_metadata jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE medical.communication_messages
    SET 
        delivered_at = CURRENT_TIMESTAMP,
        metadata = COALESCE(metadata, '{}'::jsonb) || COALESCE(p_delivery_metadata, '{}'::jsonb)
    WHERE id = p_message_id;
END;
$$;

-- Function to mark message as read
CREATE OR REPLACE FUNCTION medical.mark_message_read(
    p_message_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE medical.communication_messages
    SET read_at = CURRENT_TIMESTAMP
    WHERE id = p_message_id;
END;
$$; 