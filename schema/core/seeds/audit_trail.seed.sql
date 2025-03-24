-- Seed: core.audit_trail
-- Seed data for core.audit_trail

INSERT INTO core.audit_trail (
        table_schema,
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        changed_columns,
        performed_by,
        client_id,
        source_type,
        ip_address,
        user_agent,
        session_id,
        correlation_id,
        change_reason,
        app_version
    )
    VALUES (
        TG_TABLE_SCHEMA,
        TG_TABLE_NAME,
        COALESCE(NEW.id::TEXT, OLD.id::TEXT),
        TG_OP,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN old_data ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN new_data ELSE NULL END,
        changed_cols,
        COALESCE(
            auth.uid(),
            current_setting('app.current_user_id', true)::uuid
        ),
        NULLIF(current_setting('app.current_client_id', true), '')::uuid,
        COALESCE(
            current_setting('app.source_type', true),
            CASE 
                WHEN auth.uid() IS NOT NULL THEN 'user'
                ELSE 'system'
            END
        ),
        current_setting('request.headers', true)::jsonb->>'x-real-ip',
        current_setting('request.headers', true)::jsonb->>'user-agent',
        NULLIF(current_setting('request.jwt.claims', true)::jsonb->>'session_id', '')::uuid,
        current_setting('app.correlation_id', true),
        current_setting('app.change_reason', true),
        current_setting('app.version', true)
    );

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
