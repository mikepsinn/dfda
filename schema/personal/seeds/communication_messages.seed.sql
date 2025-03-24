-- Seed: personal.communication_messages
-- Seed data for personal.communication_messages

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
