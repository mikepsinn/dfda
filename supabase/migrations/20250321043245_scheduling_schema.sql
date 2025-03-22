-- =============================================
-- SCHEDULING SCHEMA - Appointment Scheduling
-- =============================================

-- Service Types
CREATE TABLE scheduling.service_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    duration INTEGER NOT NULL CHECK (duration > 0), -- in minutes
    color TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    requires_approval BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Providers
CREATE TABLE scheduling.service_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    title TEXT,
    bio TEXT,
    specialties TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Provider Services
CREATE TABLE scheduling.provider_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES scheduling.service_providers(id) ON DELETE CASCADE,
    service_type_id UUID NOT NULL REFERENCES scheduling.service_types(id) ON DELETE CASCADE,
    price DECIMAL CHECK (price >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider_id, service_type_id)
);

-- Provider Schedules
CREATE TABLE scheduling.provider_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES scheduling.service_providers(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Schedule Exceptions
CREATE TABLE scheduling.schedule_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES scheduling.service_providers(id) ON DELETE CASCADE,
    exception_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN DEFAULT FALSE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_exception_time CHECK (
        (start_time IS NULL AND end_time IS NULL) OR
        (start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
    )
);

-- Appointments
CREATE TABLE scheduling.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES scheduling.service_providers(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    service_type_id UUID NOT NULL REFERENCES scheduling.service_types(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    cancellation_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_appointment_time CHECK (start_time < end_time)
);

-- Appointment Reminders
CREATE TABLE scheduling.appointment_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES scheduling.appointments(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('email', 'sms', 'push')),
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointment Feedback
CREATE TABLE scheduling.appointment_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES scheduling.appointments(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(appointment_id)
);

-- Enable Row Level Security
ALTER TABLE scheduling.service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling.provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling.provider_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling.schedule_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling.appointment_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduling.appointment_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Service Types
CREATE POLICY "Service types are viewable by all"
    ON scheduling.service_types FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage service types"
    ON scheduling.service_types FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_scheduling'
    ));

-- Service Providers
CREATE POLICY "Active providers are viewable by all"
    ON scheduling.service_providers FOR SELECT
    USING (is_active = true);

CREATE POLICY "Providers can manage their own profile"
    ON scheduling.service_providers FOR ALL
    USING (auth.uid() = user_id);

-- Provider Services
CREATE POLICY "Active provider services are viewable by all"
    ON scheduling.provider_services FOR SELECT
    USING (is_active = true);

CREATE POLICY "Providers can manage their own services"
    ON scheduling.provider_services FOR ALL
    USING (EXISTS (
        SELECT 1 FROM scheduling.service_providers sp
        WHERE sp.id = provider_id
        AND sp.user_id = auth.uid()
    ));

-- Provider Schedules
CREATE POLICY "Provider schedules are viewable by all"
    ON scheduling.provider_schedules FOR SELECT
    USING (is_available = true);

CREATE POLICY "Providers can manage their own schedules"
    ON scheduling.provider_schedules FOR ALL
    USING (EXISTS (
        SELECT 1 FROM scheduling.service_providers sp
        WHERE sp.id = provider_id
        AND sp.user_id = auth.uid()
    ));

-- Schedule Exceptions
CREATE POLICY "Schedule exceptions are viewable by all"
    ON scheduling.schedule_exceptions FOR SELECT
    USING (TRUE);

CREATE POLICY "Providers can manage their own exceptions"
    ON scheduling.schedule_exceptions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM scheduling.service_providers sp
        WHERE sp.id = provider_id
        AND sp.user_id = auth.uid()
    ));

-- Appointments
CREATE POLICY "Clients can view their own appointments"
    ON scheduling.appointments FOR SELECT
    USING (auth.uid() = client_id);

CREATE POLICY "Providers can view their appointments"
    ON scheduling.appointments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM scheduling.service_providers sp
        WHERE sp.id = provider_id
        AND sp.user_id = auth.uid()
    ));

CREATE POLICY "Clients can create appointments"
    ON scheduling.appointments FOR INSERT
    WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Providers can manage their appointments"
    ON scheduling.appointments FOR ALL
    USING (EXISTS (
        SELECT 1 FROM scheduling.service_providers sp
        WHERE sp.id = provider_id
        AND sp.user_id = auth.uid()
    ));

-- Appointment Reminders
CREATE POLICY "Users can view their own reminders"
    ON scheduling.appointment_reminders FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM scheduling.appointments a
        WHERE a.id = appointment_id
        AND (a.client_id = auth.uid() OR EXISTS (
            SELECT 1 FROM scheduling.service_providers sp
            WHERE sp.id = a.provider_id
            AND sp.user_id = auth.uid()
        ))
    ));

-- Appointment Feedback
CREATE POLICY "Clients can view their own feedback"
    ON scheduling.appointment_feedback FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM scheduling.appointments a
        WHERE a.id = appointment_id
        AND a.client_id = auth.uid()
    ));

CREATE POLICY "Providers can view appointment feedback"
    ON scheduling.appointment_feedback FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM scheduling.appointments a
        JOIN scheduling.service_providers sp ON sp.id = a.provider_id
        WHERE a.id = appointment_id
        AND sp.user_id = auth.uid()
    ));

CREATE POLICY "Clients can create feedback"
    ON scheduling.appointment_feedback FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM scheduling.appointments a
        WHERE a.id = appointment_id
        AND a.client_id = auth.uid()
        AND a.status = 'completed'
    )); 