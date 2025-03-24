-- =============================================
-- CORE SCHEMA - Row Level Security Policies
-- =============================================

-- Enable RLS on core tables
ALTER TABLE core.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.user_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.data_sharing_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.user_data_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.integration_sync_logs ENABLE ROW LEVEL SECURITY;

-- Core Schema Policies

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON core.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON core.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Admins can access all profiles"
    ON core.profiles FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.profiles
        WHERE id = auth.uid()
        AND user_type = 'admin'
    ));

-- Addresses policies
CREATE POLICY "Users can view their own addresses"
    ON core.addresses FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own addresses"
    ON core.addresses FOR ALL
    USING (auth.uid() = user_id);

-- User Groups policies
CREATE POLICY "Users can view groups they are members of"
    ON core.user_groups FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_group_members
        WHERE group_id = core.user_groups.id
        AND user_id = auth.uid()
    ));

CREATE POLICY "Group admins can manage their groups"
    ON core.user_groups FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_group_members
        WHERE group_id = core.user_groups.id
        AND user_id = auth.uid()
        AND role = 'admin'
    ));

-- User consents policies
CREATE POLICY "Users can view their own consents"
    ON core.user_consents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own consents"
    ON core.user_consents FOR ALL
    USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
    ON core.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can mark their notifications as read"
    ON core.notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (
        auth.uid() = user_id
        AND (
            -- Only allow updating is_read field
            NEW.id = OLD.id
            AND NEW.user_id = OLD.user_id
            AND NEW.title = OLD.title
            AND NEW.message = OLD.message
            AND NEW.notification_type = OLD.notification_type
            AND NEW.related_resource_type = OLD.related_resource_type
            AND NEW.related_resource_id = OLD.related_resource_id
            AND NEW.created_at = OLD.created_at
        )
    );

-- Integration policies
CREATE POLICY "Users can view their integrations"
    ON core.integration_connections FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage their integrations"
    ON core.integration_connections FOR ALL
    USING (user_id = auth.uid());

CREATE POLICY "Users can view their sync logs"
    ON core.integration_sync_logs FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.integration_connections
        WHERE id = core.integration_sync_logs.connection_id
        AND user_id = auth.uid()
    )); 