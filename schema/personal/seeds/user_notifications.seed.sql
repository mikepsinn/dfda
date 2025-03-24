-- Seed: personal.user_notifications
-- Seed data for personal.user_notifications

INSERT INTO personal.user_notifications (
        user_id,
        type,
        title,
        message,
        priority,
        scheduled_for,
        action_type,
        action_data
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_message,
        p_priority,
        p_scheduled_for,
        p_action_type,
        p_action_data
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
