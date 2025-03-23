-- Communication Functions
--
-- Functions for managing communication messages
-- Includes functions for adding messages and tracking delivery/read status
--

-- Function to add message to session
CREATE OR REPLACE FUNCTION personal.add_session_message(
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
    INSERT INTO personal.communication_messages (
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
    UPDATE personal.check_in_sessions
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
CREATE OR REPLACE FUNCTION personal.mark_message_delivered(
    p_message_id uuid,
    p_delivery_metadata jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE personal.communication_messages
    SET 
        delivered_at = CURRENT_TIMESTAMP,
        metadata = COALESCE(metadata, '{}'::jsonb) || COALESCE(p_delivery_metadata, '{}'::jsonb)
    WHERE id = p_message_id;
END;
$$;

-- Function to mark message as read
CREATE OR REPLACE FUNCTION personal.mark_message_read(
    p_message_id uuid
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE personal.communication_messages
    SET read_at = CURRENT_TIMESTAMP
    WHERE id = p_message_id;
END;
$$; 