-- Combined schema migration

-- Generated at: 2025-03-24T05:51:53.661Z

-- Create schemas
CREATE SCHEMA IF NOT EXISTS cohort;
CREATE SCHEMA IF NOT EXISTS commerce;
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS finance;
CREATE SCHEMA IF NOT EXISTS global;
CREATE SCHEMA IF NOT EXISTS logistics;
CREATE SCHEMA IF NOT EXISTS medical_ref;
CREATE SCHEMA IF NOT EXISTS models;
CREATE SCHEMA IF NOT EXISTS oauth2;
CREATE SCHEMA IF NOT EXISTS personal;
CREATE SCHEMA IF NOT EXISTS reference;
CREATE SCHEMA IF NOT EXISTS scheduling;


-- Schema: cohort, File: adverse_events.sql
-- Trial Adverse Events
CREATE TABLE cohort.adverse_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_id UUID NOT NULL REFERENCES cohort.participants(id) ON DELETE CASCADE,
    variable_id UUID NOT NULL REFERENCES medical_ref.variables(id) ON DELETE CASCADE,
    onset_date TIMESTAMP WITH TIME ZONE NOT NULL,
    resolution_date TIMESTAMP WITH TIME ZONE,
    severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'life_threatening', 'death')),
    relatedness TEXT CHECK (relatedness IN ('unrelated', 'unlikely', 'possible', 'probable', 'definite')),
    is_serious BOOLEAN DEFAULT FALSE,
    action_taken TEXT,
    outcome TEXT,
    notes TEXT,
    reported_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cohort.adverse_events ENABLE ROW LEVEL SECURITY;

-- Adverse Events Policies
CREATE POLICY "Participants can view their own adverse events"
    ON cohort.adverse_events FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM cohort.participants p 
        WHERE p.id = participant_id 
        AND p.user_id = auth.uid()
    ));

CREATE POLICY "Trial creators can view all adverse events"
    ON cohort.adverse_events FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM cohort.participants p
        JOIN cohort.protocols pr ON pr.id = p.protocol_id
        WHERE p.id = participant_id 
        AND pr.created_by = auth.uid()
    ));

CREATE POLICY "Trial creators can manage adverse events"
    ON cohort.adverse_events FOR ALL
    USING (EXISTS (
        SELECT 1 FROM cohort.participants p
        JOIN cohort.protocols pr ON pr.id = p.protocol_id
        WHERE p.id = participant_id 
        AND pr.created_by = auth.uid()
    )); 

-- Schema: cohort, File: interventions.sql
-- Trial Interventions
CREATE TABLE cohort.interventions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    arm_id UUID NOT NULL REFERENCES cohort.arms(id) ON DELETE CASCADE,
    variable_id UUID NOT NULL REFERENCES medical_ref.variables(id) ON DELETE CASCADE,
    dosage DECIMAL,
    unit_id UUID REFERENCES medical_ref.units_of_measurement(id) ON DELETE RESTRICT,
    frequency TEXT,
    duration TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cohort.interventions ENABLE ROW LEVEL SECURITY;

-- Interventions Policies
CREATE POLICY "Interventions are viewable with protocol"
    ON cohort.interventions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM cohort.arms a
        JOIN cohort.protocols p ON p.id = a.protocol_id
        WHERE a.id = arm_id 
        AND (p.status IN ('active', 'completed') OR p.created_by = auth.uid())
    ));

CREATE POLICY "Trial creators can manage interventions"
    ON cohort.interventions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM cohort.arms a
        JOIN cohort.protocols p ON p.id = a.protocol_id
        WHERE a.id = arm_id 
        AND p.created_by = auth.uid()
    )); 

-- Schema: cohort, File: outcomes.sql
-- Trial Outcomes
CREATE TABLE cohort.outcomes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocol_id UUID NOT NULL REFERENCES cohort.protocols(id) ON DELETE CASCADE,
    variable_id UUID NOT NULL REFERENCES medical_ref.variables(id) ON DELETE CASCADE,
    outcome_type TEXT CHECK (outcome_type IN ('primary', 'secondary', 'exploratory')),
    measurement_schedule TEXT,
    target_difference DECIMAL,
    statistical_power DECIMAL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cohort.outcomes ENABLE ROW LEVEL SECURITY;

-- Outcomes Policies
CREATE POLICY "Outcomes are viewable with protocol"
    ON cohort.outcomes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM cohort.protocols p 
        WHERE p.id = protocol_id 
        AND (p.status IN ('active', 'completed') OR p.created_by = auth.uid())
    ));

CREATE POLICY "Trial creators can manage outcomes"
    ON cohort.outcomes FOR ALL
    USING (EXISTS (
        SELECT 1 FROM cohort.protocols p 
        WHERE p.id = protocol_id 
        AND p.created_by = auth.uid()
    )); 

-- Schema: cohort, File: protocols.sql
-- Trial Protocols
CREATE TABLE cohort.protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    hypothesis TEXT,
    study_type TEXT NOT NULL,
    phase TEXT CHECK (phase IN ('0', '1', '2', '3', '4', 'n/a')),
    status TEXT CHECK (status IN ('draft', 'pending_review', 'approved', 'active', 'completed', 'terminated', 'withdrawn')),
    start_date DATE,
    end_date DATE,
    target_participants INTEGER,
    inclusion_criteria TEXT[],
    exclusion_criteria TEXT[],
    created_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    approval_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cohort.protocols ENABLE ROW LEVEL SECURITY;

-- Protocols Policies
CREATE POLICY "Public protocols are viewable by all"
    ON cohort.protocols FOR SELECT
    USING (status IN ('active', 'completed'));

CREATE POLICY "Trial creators can manage their protocols"
    ON cohort.protocols FOR ALL
    USING (auth.uid() = created_by); 

-- Schema: cohort, File: trials.sql
-- Create trials table
CREATE TABLE cohort.trials (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    status text NOT NULL DEFAULT 'draft',
    oauth_client_id uuid REFERENCES oauth2.clients(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE cohort.trials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Trials are viewable by authenticated users" ON cohort.trials
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Trials are insertable by authenticated users" ON cohort.trials
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Trials are updatable by creators" ON cohort.trials
    FOR UPDATE USING (auth.uid() = created_by);

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON cohort.trials
    FOR EACH ROW
    EXECUTE FUNCTION common.set_updated_at(); 

-- Schema: cohort, File: trials_participants.sql
-- Trial Participants
CREATE TABLE cohort.trials_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trial_id UUID NOT NULL REFERENCES cohort.trials(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    trial_arm_id UUID REFERENCES cohort.trial_arms(id) ON DELETE SET NULL,
    enrollment_date DATE NOT NULL,
    withdrawal_date DATE,
    withdrawal_reason TEXT,
    status TEXT CHECK (status IN ('screening', 'enrolled', 'active', 'completed', 'withdrawn', 'excluded')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trial_id, user_id)
);

-- Enable RLS
ALTER TABLE cohort.trials_participants ENABLE ROW LEVEL SECURITY;

-- Participants Policies
CREATE POLICY "Participants can view their own enrollment"
    ON cohort.trials_participants FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Trial creators can view all participants"
    ON cohort.trials_participants FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM cohort.trials t 
        WHERE t.id = trial_id 
        AND t.created_by = auth.uid()
    ));

CREATE POLICY "Trial creators can manage participants"
    ON cohort.trials_participants FOR ALL
    USING (EXISTS (
        SELECT 1 FROM cohort.trials t 
        WHERE t.id = trial_id 
        AND t.created_by = auth.uid()
    )); 

-- Schema: cohort, File: trial_arms.sql
-- Create trial arms table
CREATE TABLE cohort.trial_arms (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    trial_id uuid REFERENCES cohort.trials(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE cohort.trial_arms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Trial arms are viewable by authenticated users" ON cohort.trial_arms
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Trial arms are insertable by trial creators" ON cohort.trial_arms
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT created_by 
            FROM cohort.trials 
            WHERE id = trial_id
        )
    );

CREATE POLICY "Trial arms are updatable by trial creators" ON cohort.trial_arms
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT created_by 
            FROM cohort.trials 
            WHERE id = trial_id
        )
    );

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON cohort.trial_arms
    FOR EACH ROW
    EXECUTE FUNCTION common.set_updated_at(); 

-- Schema: cohort, File: trial_documents.sql
-- Trial Documents
CREATE TABLE cohort.trial_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trial_id UUID NOT NULL REFERENCES cohort.trials(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    version TEXT,
    is_current_version BOOLEAN DEFAULT TRUE,
    uploaded_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE cohort.trial_documents ENABLE ROW LEVEL SECURITY;

-- Documents Policies
CREATE POLICY "Documents are viewable with trial"
    ON cohort.trial_documents FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM cohort.trials t 
        WHERE t.id = trial_id 
        AND (t.status IN ('active', 'completed') OR t.created_by = auth.uid())
    ));

CREATE POLICY "Trial creators can manage documents"
    ON cohort.trial_documents FOR ALL
    USING (EXISTS (
        SELECT 1 FROM cohort.trials t 
        WHERE t.id = trial_id 
        AND t.created_by = auth.uid()
    )); 

-- Schema: cohort, File: trial_measurements.sql
-- Trial Measurements linking table
CREATE TABLE cohort.trial_measurements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    trial_id uuid REFERENCES cohort.trials(id) ON DELETE CASCADE NOT NULL,
    measurement_id bigint REFERENCES personal.measurements(id) ON DELETE CASCADE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    UNIQUE(trial_id, measurement_id)
);

-- Enable RLS
ALTER TABLE cohort.trial_measurements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Trial measurements are viewable by trial participants and creators" ON cohort.trial_measurements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM personal.measurements m
            JOIN cohort.trials_participants tp ON m.user_id = tp.user_id
            WHERE m.id = measurement_id
            AND tp.trial_id = trial_id
        ) OR
        EXISTS (
            SELECT 1 FROM cohort.trials t
            WHERE t.id = trial_id
            AND t.created_by = auth.uid()
        )
    );

CREATE POLICY "Trial measurements are insertable by trial creators" ON cohort.trial_measurements
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM cohort.trials t
            WHERE t.id = trial_id
            AND t.created_by = auth.uid()
        )
    );

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON cohort.trial_measurements
    FOR EACH ROW
    EXECUTE FUNCTION common.set_updated_at(); 

-- Schema: cohort, File: trial_phases.sql
-- Create trial phases table
CREATE TABLE cohort.trial_phases (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    trial_id uuid REFERENCES cohort.trials(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    sequence_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE cohort.trial_phases ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Trial phases are viewable by authenticated users" ON cohort.trial_phases
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Trial phases are insertable by trial creators" ON cohort.trial_phases
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT created_by 
            FROM cohort.trials 
            WHERE id = trial_id
        )
    );

CREATE POLICY "Trial phases are updatable by trial creators" ON cohort.trial_phases
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT created_by 
            FROM cohort.trials 
            WHERE id = trial_id
        )
    );

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON cohort.trial_phases
    FOR EACH ROW
    EXECUTE FUNCTION common.set_updated_at(); 

-- Schema: commerce, File: cart_items.sql
-- Shopping Cart Items
CREATE TABLE commerce.cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES commerce.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- Enable Row Level Security
ALTER TABLE commerce.cart_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own cart"
    ON commerce.cart_items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own cart"
    ON commerce.cart_items FOR ALL
    USING (auth.uid() = user_id); 

-- Schema: commerce, File: commerce_schema.sql
-- =============================================
-- COMMERCE SCHEMA - E-commerce Data
-- =============================================

CREATE SCHEMA IF NOT EXISTS commerce; 

-- Schema: commerce, File: discounts.sql
-- Discounts
CREATE TABLE commerce.discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL NOT NULL CHECK (discount_value >= 0),
    minimum_purchase_amount DECIMAL CHECK (minimum_purchase_amount >= 0),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    usage_limit INTEGER,
    times_used INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_discount_dates CHECK (end_date IS NULL OR start_date <= end_date)
);

-- Enable Row Level Security
ALTER TABLE commerce.discounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Active discounts are viewable by all"
    ON commerce.discounts FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage discounts"
    ON commerce.discounts FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_discounts'
    )); 

-- Schema: commerce, File: orders.sql
-- Orders
CREATE TABLE commerce.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    order_number TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    total_amount DECIMAL NOT NULL CHECK (total_amount >= 0),
    shipping_amount DECIMAL NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
    tax_amount DECIMAL NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    discount_amount DECIMAL NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    shipping_address_id UUID NOT NULL REFERENCES core.addresses(id),
    billing_address_id UUID NOT NULL REFERENCES core.addresses(id),
    payment_intent_id TEXT,
    payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE commerce.orders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own orders"
    ON commerce.orders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
    ON commerce.orders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage orders"
    ON commerce.orders FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_orders'
    )); 

-- Schema: commerce, File: order_items.sql
-- Order Items
CREATE TABLE commerce.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES commerce.orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES commerce.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL NOT NULL CHECK (total_price >= 0),
    discount_amount DECIMAL NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE commerce.order_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own order items"
    ON commerce.order_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM commerce.orders o
        WHERE o.id = order_id
        AND o.user_id = auth.uid()
    ));

CREATE POLICY "Admins can manage order items"
    ON commerce.order_items FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_orders'
    )); 

-- Schema: commerce, File: products.sql
-- Products
CREATE TABLE commerce.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    variable_id UUID NOT NULL REFERENCES medical_ref.variables(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    short_description TEXT,
    sku TEXT UNIQUE,
    price DECIMAL NOT NULL CHECK (price >= 0),
    sale_price DECIMAL CHECK (sale_price >= 0),
    sale_start_date TIMESTAMP WITH TIME ZONE,
    sale_end_date TIMESTAMP WITH TIME ZONE,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    is_featured BOOLEAN DEFAULT FALSE,
    requires_prescription BOOLEAN DEFAULT FALSE,
    manufacturer TEXT,
    brand TEXT,
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_sale_dates CHECK (sale_start_date IS NULL OR sale_end_date IS NULL OR sale_start_date <= sale_end_date),
    CONSTRAINT valid_sale_price CHECK (sale_price IS NULL OR sale_price <= price)
);

-- Enable Row Level Security
ALTER TABLE commerce.products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Active products are viewable by all"
    ON commerce.products FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage products"
    ON commerce.products FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_products'
    )); 

-- Schema: commerce, File: product_images.sql
-- Product Images
CREATE TABLE commerce.product_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES commerce.products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, url)
);

-- Enable Row Level Security
ALTER TABLE commerce.product_images ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Product images are viewable by all"
    ON commerce.product_images FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM commerce.products p
        WHERE p.id = product_id
        AND p.is_active = true
    ));

CREATE POLICY "Admins can manage product images"
    ON commerce.product_images FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_products'
    )); 

-- Schema: commerce, File: product_reviews.sql
-- Product Reviews
CREATE TABLE commerce.product_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES commerce.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title TEXT,
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE commerce.product_reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Approved reviews are viewable by all"
    ON commerce.product_reviews FOR SELECT
    USING (is_approved = true);

CREATE POLICY "Users can manage their own reviews"
    ON commerce.product_reviews FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews"
    ON commerce.product_reviews FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_reviews'
    )); 

-- Schema: commerce, File: wishlists.sql
-- Wishlists
CREATE TABLE commerce.wishlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE commerce.wishlists ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public wishlists are viewable by all"
    ON commerce.wishlists FOR SELECT
    USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own wishlists"
    ON commerce.wishlists FOR ALL
    USING (auth.uid() = user_id); 

-- Schema: commerce, File: wishlist_items.sql
-- Wishlist Items
CREATE TABLE commerce.wishlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wishlist_id UUID NOT NULL REFERENCES commerce.wishlists(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES commerce.products(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(wishlist_id, product_id)
);

-- Enable Row Level Security
ALTER TABLE commerce.wishlist_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Wishlist items are viewable with wishlist"
    ON commerce.wishlist_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM commerce.wishlists w
        WHERE w.id = wishlist_id
        AND (w.is_public = true OR w.user_id = auth.uid())
    ));

CREATE POLICY "Users can manage their own wishlist items"
    ON commerce.wishlist_items FOR ALL
    USING (EXISTS (
        SELECT 1 FROM commerce.wishlists w
        WHERE w.id = wishlist_id
        AND w.user_id = auth.uid()
    )); 

-- Schema: core, File: access_control.sql
-- =============================================
-- CORE SCHEMA - Access Control
-- =============================================

-- User Permissions and Access Control
CREATE TABLE core.user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    resource_type TEXT NOT NULL,
    resource_id UUID NOT NULL,
    permission_level TEXT NOT NULL CHECK (permission_level IN ('read', 'write', 'admin')),
    granted_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(user_id, resource_type, resource_id)
);

-- User Groups
CREATE TABLE core.user_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- User Group Members
CREATE TABLE core.user_group_members (
    group_id UUID NOT NULL REFERENCES core.user_groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('member', 'admin')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    PRIMARY KEY (group_id, user_id)
); 

-- Schema: core, File: audit.sql
-- =============================================
-- CORE SCHEMA - Audit System
-- =============================================

-- Audit Settings
CREATE TABLE core.audit_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_schema TEXT NOT NULL,
    table_name TEXT NOT NULL,
    is_audited BOOLEAN DEFAULT true,
    excluded_columns TEXT[] DEFAULT '{}',
    track_old_values BOOLEAN DEFAULT true,
    track_new_values BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(table_schema, table_name)
);

COMMENT ON TABLE core.audit_settings IS 'Configuration for which tables and columns are audited';

-- Audit Trail
CREATE TABLE core.audit_trail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_schema TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,  -- Using TEXT to support non-UUID primary keys
    action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
    old_values JSONB,
    new_values JSONB,
    changed_columns TEXT[],
    performed_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    client_id UUID REFERENCES oauth2.clients(id) ON DELETE SET NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('user', 'client', 'system', 'integration', 'migration')),
    ip_address TEXT,
    user_agent TEXT,
    session_id UUID,
    correlation_id TEXT,
    change_reason TEXT,
    app_version TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common audit queries
CREATE INDEX idx_audit_trail_record ON core.audit_trail(table_schema, table_name, record_id);
CREATE INDEX idx_audit_trail_performed_by ON core.audit_trail(performed_by);
CREATE INDEX idx_audit_trail_client ON core.audit_trail(client_id);
CREATE INDEX idx_audit_trail_timestamp ON core.audit_trail(created_at DESC);
CREATE INDEX idx_audit_trail_correlation ON core.audit_trail(correlation_id);

COMMENT ON TABLE core.audit_trail IS 'Comprehensive audit trail for tracking all data changes';

-- Function to compare jsonb objects and return changed keys
CREATE OR REPLACE FUNCTION core.jsonb_changed_keys(old_data JSONB, new_data JSONB)
RETURNS TEXT[] AS $$
DECLARE
    changed TEXT[];
    key TEXT;
BEGIN
    changed := ARRAY[]::TEXT[];
    
    -- Check deleted and modified keys
    FOR key IN SELECT * FROM jsonb_object_keys(old_data)
    LOOP
        IF NOT new_data ? key OR new_data->key IS DISTINCT FROM old_data->key THEN
            changed := array_append(changed, key);
        END IF;
    END LOOP;
    
    -- Check new keys
    FOR key IN SELECT * FROM jsonb_object_keys(new_data)
    LOOP
        IF NOT old_data ? key THEN
            changed := array_append(changed, key);
        END IF;
    END LOOP;
    
    RETURN changed;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to check if a table should be audited
CREATE OR REPLACE FUNCTION core.should_audit_table(p_schema TEXT, p_table TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM core.audit_settings 
        WHERE table_schema = p_schema 
        AND table_name = p_table 
        AND is_audited = true
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Main audit trigger function
CREATE OR REPLACE FUNCTION core.log_audit()
RETURNS trigger AS $$
DECLARE
    excluded_cols TEXT[];
    old_data JSONB;
    new_data JSONB;
    changed_cols TEXT[];
BEGIN
    -- Check if we should audit this table
    IF NOT core.should_audit_table(TG_TABLE_SCHEMA, TG_TABLE_NAME) THEN
        RETURN NULL;
    END IF;

    -- Get excluded columns
    SELECT COALESCE(excluded_columns, '{}'::TEXT[])
    INTO excluded_cols
    FROM core.audit_settings
    WHERE table_schema = TG_TABLE_SCHEMA
    AND table_name = TG_TABLE_NAME;

    -- Prepare the data, excluding specified columns
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        old_data := to_jsonb(OLD);
        FOREACH excluded_cols AS excluded_col LOOP
            old_data := old_data - excluded_col;
        END LOOP;
    END IF;

    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        new_data := to_jsonb(NEW);
        FOREACH excluded_cols AS excluded_col LOOP
            new_data := new_data - excluded_col;
        END LOOP;
    END IF;

    -- For updates, only log if there are actual changes
    IF TG_OP = 'UPDATE' THEN
        changed_cols := core.jsonb_changed_keys(old_data, new_data);
        IF changed_cols = '{}'::TEXT[] THEN
            RETURN NULL;
        END IF;
    END IF;

    -- Insert audit record
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

-- Function to add audit trigger to a table
CREATE OR REPLACE FUNCTION core.enable_audit_for_table(
    p_schema TEXT,
    p_table TEXT,
    p_excluded_columns TEXT[] DEFAULT '{}'::TEXT[]
) RETURNS VOID AS $$
BEGIN
    -- Create or update audit settings
    INSERT INTO core.audit_settings (
        table_schema,
        table_name,
        excluded_columns
    ) 
    VALUES (
        p_schema,
        p_table,
        p_excluded_columns
    )
    ON CONFLICT (table_schema, table_name) 
    DO UPDATE SET 
        excluded_columns = p_excluded_columns,
        is_audited = true,
        updated_at = NOW();

    -- Create the trigger if it doesn't exist
    EXECUTE format('
        DROP TRIGGER IF EXISTS audit_trigger ON %I.%I;
        CREATE TRIGGER audit_trigger
        AFTER INSERT OR UPDATE OR DELETE ON %I.%I
        FOR EACH ROW EXECUTE FUNCTION core.log_audit();
    ', p_schema, p_table, p_schema, p_table);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to disable auditing for a table
CREATE OR REPLACE FUNCTION core.disable_audit_for_table(
    p_schema TEXT,
    p_table TEXT
) RETURNS VOID AS $$
BEGIN
    -- Update audit settings
    UPDATE core.audit_settings 
    SET is_audited = false,
        updated_at = NOW()
    WHERE table_schema = p_schema 
    AND table_name = p_table;

    -- Remove the trigger
    EXECUTE format('
        DROP TRIGGER IF EXISTS audit_trigger ON %I.%I;
    ', p_schema, p_table);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE core.audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.audit_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can manage audit settings"
    ON core.audit_settings
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM core.user_permissions up
            WHERE up.user_id = auth.uid()
            AND up.permission = 'manage_audit_settings'
        )
    );

CREATE POLICY "Users can view their own audit trail"
    ON core.audit_trail
    FOR SELECT
    TO authenticated
    USING (
        performed_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM core.user_permissions up
            WHERE up.user_id = auth.uid()
            AND up.permission = 'view_all_audit_logs'
        )
    );

-- Add initial audit settings for key tables
SELECT core.enable_audit_for_table('personal', 'measurements');
SELECT core.enable_audit_for_table('personal', 'variable_relationships');
SELECT core.enable_audit_for_table('personal', 'user_variables');
SELECT core.enable_audit_for_table('reference', 'variables');
SELECT core.enable_audit_for_table('reference', 'variable_categories');
SELECT core.enable_audit_for_table('reference', 'units_of_measurement');

-- Integration Providers
CREATE TABLE core.integration_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    auth_type TEXT NOT NULL CHECK (auth_type IN ('oauth2', 'api_key', 'basic_auth')),
    oauth_config JSONB,
    api_base_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Integration Connections
CREATE TABLE core.integration_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES core.integration_providers(id) ON DELETE CASCADE,
    auth_provider_id TEXT,
    auth_user_id TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    connection_status TEXT NOT NULL CHECK (connection_status IN ('connected', 'disconnected', 'expired', 'revoked', 'error')),
    status_message TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(user_id, provider_id)
);

-- Integration Sync Logs
CREATE TABLE core.integration_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id UUID NOT NULL REFERENCES core.integration_connections(id) ON DELETE CASCADE,
    sync_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    sync_completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'failed')),
    data_types TEXT[],
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
); 

-- Schema: core, File: consents.sql
-- =============================================
-- CORE SCHEMA - Consents and Agreements
-- =============================================

-- User Consents
CREATE TABLE core.user_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL CHECK (consent_type IN ('data_collection', 'data_sharing', 'research_use', 'marketing', 'trial_participation')),
    protocol_id UUID, -- Will be referenced later
    consented BOOLEAN NOT NULL,
    consent_version TEXT NOT NULL,
    ip_address TEXT,
    consent_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expiration_date TIMESTAMP WITH TIME ZONE,
    revocation_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(user_id, consent_type, protocol_id, consent_version)
);

-- Data Sharing Agreements
CREATE TABLE core.data_sharing_agreements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    agreement_text TEXT NOT NULL,
    version TEXT NOT NULL,
    effective_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expiration_date TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- User Data Exports
CREATE TABLE core.user_data_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    export_date TIMESTAMP WITH TIME ZONE NOT NULL,
    export_format TEXT NOT NULL,
    data_types TEXT[] NOT NULL,
    date_range_start TIMESTAMP WITH TIME ZONE,
    date_range_end TIMESTAMP WITH TIME ZONE,
    reason TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
); 

-- Schema: core, File: notifications.sql
-- =============================================
-- CORE SCHEMA - Notifications and Tags
-- =============================================

-- Notifications
CREATE TABLE core.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    related_resource_type TEXT,
    related_resource_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tags
CREATE TABLE core.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tagged Items
CREATE TABLE core.tagged_items (
    tag_id UUID NOT NULL REFERENCES core.tags(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL,
    item_id UUID NOT NULL,
    tagged_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    tagged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    PRIMARY KEY (tag_id, item_type, item_id)
); 

-- Schema: core, File: policies.sql
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

-- Schema: core, File: profiles.sql
-- =============================================
-- CORE SCHEMA - Profiles and Addresses
-- =============================================

-- Profiles Table - Links to Supabase auth.users
CREATE TABLE core.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    organization_name TEXT,
    contact_name TEXT,
    user_type TEXT NOT NULL CHECK (user_type IN ('patient', 'doctor', 'sponsor', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Addresses
CREATE TABLE core.addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    address_type TEXT NOT NULL CHECK (address_type IN ('shipping', 'billing', 'both')),
    is_default BOOLEAN DEFAULT FALSE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    company TEXT,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
); 

-- Schema: core, File: user_groups.sql
-- User Groups
--
-- System user groups for role-based access control
-- Defines the main user roles in the system
--
CREATE TABLE core.user_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default user groups
INSERT INTO core.user_groups (name, description) VALUES
('administrators', 'System administrators with full access'),
('staff', 'Staff members with elevated privileges'),
('researchers', 'Research team members'),
('providers', 'Healthcare providers'),
('patients', 'Regular patients/users'); 

-- Schema: core, File: user_permissions.sql
-- User Permissions
--
-- System permissions for fine-grained access control
-- Defines individual permissions that can be assigned to user groups
--
CREATE TABLE core.user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permission VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default permissions
INSERT INTO core.user_permissions (permission, description) VALUES
('manage_users', 'Can manage user accounts'),
('view_users', 'Can view user profiles'),
('manage_trials', 'Can manage clinical trials'),
('view_trials', 'Can view clinical trial data'),
('manage_medical', 'Can manage medical records'),
('view_medical', 'Can view medical records'),
('manage_commerce', 'Can manage e-commerce operations'),
('view_commerce', 'Can view e-commerce data'),
('manage_scheduling', 'Can manage scheduling'),
('view_scheduling', 'Can view schedules'),
('manage_logistics', 'Can manage logistics'),
('view_logistics', 'Can view logistics data'),
('manage_finances', 'Can manage financial operations'),
('view_finances', 'Can view financial data'),
('manage_oauth2', 'Can manage OAuth2 applications'),
('view_oauth2', 'Can view OAuth2 data'); 

-- Schema: finance, File: credits.sql
-- Credits
CREATE TABLE finance.credits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    credit_type TEXT NOT NULL CHECK (credit_type IN ('refund', 'promotion', 'compensation')),
    status TEXT NOT NULL CHECK (status IN ('active', 'used', 'expired')),
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE finance.credits ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own credits"
    ON finance.credits FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all credits"
    ON finance.credits FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_finances'
    ));

CREATE POLICY "Staff can manage credits"
    ON finance.credits FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_finances'
    )); 

-- Schema: finance, File: credit_transactions.sql
-- Credit Transactions
CREATE TABLE finance.credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credit_id UUID NOT NULL REFERENCES finance.credits(id) ON DELETE CASCADE,
    amount DECIMAL NOT NULL CHECK (amount >= 0),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('apply', 'refund')),
    reference_type TEXT,
    reference_id UUID,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE finance.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own credit transactions"
    ON finance.credit_transactions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM finance.credits c
        WHERE c.id = credit_id
        AND c.user_id = auth.uid()
    ));

CREATE POLICY "Staff can view all credit transactions"
    ON finance.credit_transactions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_finances'
    ));

CREATE POLICY "Staff can manage credit transactions"
    ON finance.credit_transactions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_finances'
    )); 

-- Schema: finance, File: finance_schema.sql
-- =============================================
-- FINANCE SCHEMA - Financial Data
-- =============================================

CREATE SCHEMA IF NOT EXISTS finance; 

-- Schema: finance, File: invoices.sql
 

-- Schema: finance, File: invoice_items.sql
 

-- Schema: finance, File: payment_methods.sql
-- Payment Methods
CREATE TABLE finance.payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('credit_card', 'bank_account', 'digital_wallet')),
    provider TEXT NOT NULL,
    account_last4 TEXT NOT NULL,
    expiry_date DATE,
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    billing_address_id UUID REFERENCES core.addresses(id),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE finance.payment_methods ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own payment methods"
    ON finance.payment_methods FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own payment methods"
    ON finance.payment_methods FOR ALL
    USING (auth.uid() = user_id); 

-- Schema: finance, File: subscriptions.sql
-- Subscriptions
CREATE TABLE finance.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
    amount DECIMAL NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'quarterly', 'annual')),
    start_date DATE NOT NULL,
    end_date DATE,
    next_billing_date DATE,
    payment_method_id UUID REFERENCES finance.payment_methods(id),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_subscription_dates CHECK (
        start_date <= end_date
        AND (next_billing_date IS NULL OR next_billing_date >= start_date)
    )
);

-- Enable Row Level Security
ALTER TABLE finance.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own subscriptions"
    ON finance.subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all subscriptions"
    ON finance.subscriptions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_finances'
    ));

CREATE POLICY "Staff can manage subscriptions"
    ON finance.subscriptions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_finances'
    )); 

-- Schema: finance, File: subscription_items.sql
-- Subscription Items
CREATE TABLE finance.subscription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES finance.subscriptions(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL NOT NULL CHECK (unit_price >= 0),
    amount DECIMAL NOT NULL CHECK (amount >= 0),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE finance.subscription_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own subscription items"
    ON finance.subscription_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM finance.subscriptions s
        WHERE s.id = subscription_id
        AND s.user_id = auth.uid()
    ));

CREATE POLICY "Staff can view all subscription items"
    ON finance.subscription_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_finances'
    ));

CREATE POLICY "Staff can manage subscription items"
    ON finance.subscription_items FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_finances'
    )); 

-- Schema: finance, File: transactions.sql
-- Transactions
CREATE TABLE finance.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'credit', 'debit')),
    amount DECIMAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    payment_method_id UUID REFERENCES finance.payment_methods(id),
    reference_type TEXT,
    reference_id UUID,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE finance.transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own transactions"
    ON finance.transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all transactions"
    ON finance.transactions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_finances'
    ));

CREATE POLICY "Staff can manage transactions"
    ON finance.transactions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_finances'
    )); 

-- Schema: global, File: 000_types.sql
-- Global Types and Enums
--
-- Shared custom types and enums used across multiple tables
-- These types should be created before other migrations that reference them
--

-- Filling type for handling missing data
CREATE TYPE filling_type_enum AS ENUM (
    'zero',        -- Fill gaps with zero
    'none',        -- Leave gaps as is
    'interpolation', -- Use interpolation between points
    'value'         -- Use a specific value
);

-- Valence type for positive/negative indicators
CREATE TYPE valence_type_enum AS ENUM (
    'positive',  -- Higher values are better
    'negative',  -- Lower values are better
    'neutral'    -- No inherent good/bad value
);

-- Frequency type for occurrence patterns
CREATE TYPE frequency_type_enum AS ENUM (
    'always',    -- Consistently occurs
    'sometimes', -- Occasionally occurs
    'never'      -- Does not occur
);

-- Operation type for combining measurements
CREATE TYPE combination_operation_enum AS ENUM (
    'sum',  -- Add values together
    'mean'  -- Take average of values
);

-- Scale type for measurement scales
CREATE TYPE scale_type_enum AS ENUM (
    'nominal',   -- Categories with no order
    'ordinal',   -- Ordered categories
    'interval',  -- Equal intervals, no true zero
    'ratio'      -- Equal intervals with true zero
);

COMMENT ON TYPE filling_type_enum IS 'Specifies how periods of missing data should be treated';
COMMENT ON TYPE valence_type_enum IS 'Indicates whether higher or lower values are considered better';
COMMENT ON TYPE frequency_type_enum IS 'Describes how often something occurs or should occur';
COMMENT ON TYPE combination_operation_enum IS 'Specifies how multiple measurements should be combined';
COMMENT ON TYPE scale_type_enum IS 'Defines the type of measurement scale being used'; 

-- Schema: global, File: global_schema.sql
-- Global Schema
-- Contains globally aggregated data from user contributions
CREATE SCHEMA global; 

-- Schema: global, File: user_variable_global_stats.sql
-- Variable Global Statistics View
--
-- Aggregates variable statistics across all users
-- combining with global variable settings
--
CREATE MATERIALIZED VIEW global.variable_global_stats AS
WITH variable_stats AS (
    SELECT 
        variable_id,
        COUNT(DISTINCT user_id) as number_of_users,
        SUM(measurement_count) as total_measurements,
        MIN(min_value) as global_minimum_value,
        MAX(max_value) as global_maximum_value,
        AVG(avg_value) as average_value_across_users,
        STDDEV(avg_value) as std_dev_between_users,
        AVG(std_dev) as avg_std_dev_within_users,
        MIN(first_tracked_at) as earliest_measurement,
        MAX(last_tracked_at) as latest_measurement,
        AVG(measurements_per_day) as avg_measurements_per_day
    FROM personal.variable_user_stats
    GROUP BY variable_id
)
SELECT 
    gv.id as variable_id,
    gv.name,
    gv.display_name,
    gv.category_id,
    gv.data_type,
    gv.unit_id as default_unit_id,
    gv.default_value,
    gv.minimum_value as global_minimum_allowed,
    gv.maximum_value as global_maximum_allowed,
    vs.number_of_users,
    vs.total_measurements,
    vs.global_minimum_value,
    vs.global_maximum_value,
    vs.average_value_across_users,
    vs.std_dev_between_users,
    vs.avg_std_dev_within_users,
    vs.earliest_measurement,
    vs.latest_measurement,
    vs.avg_measurements_per_day,
    NOW() as last_updated
FROM reference.variables gv
LEFT JOIN variable_stats vs ON gv.id = vs.variable_id
WHERE gv.deleted_at IS NULL;

-- Create indexes for better query performance
CREATE UNIQUE INDEX idx_variable_global_stats_id
ON global.variable_global_stats(variable_id);

CREATE INDEX idx_variable_global_stats_category
ON global.variable_global_stats(category_id);

-- Add comments
COMMENT ON MATERIALIZED VIEW global.variable_global_stats IS 
'Aggregated variable statistics across all users, combined with global settings';

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION global.refresh_variable_global_stats()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY global.variable_global_stats;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh when underlying data changes
CREATE TRIGGER refresh_variable_global_stats_personal
AFTER INSERT OR UPDATE OR DELETE ON personal.variable_user_stats
FOR EACH STATEMENT EXECUTE FUNCTION global.refresh_variable_global_stats();

CREATE TRIGGER refresh_variable_global_stats_reference
AFTER INSERT OR UPDATE OR DELETE ON reference.variables
FOR EACH STATEMENT EXECUTE FUNCTION global.refresh_variable_global_stats(); 

-- Schema: global, File: variable_global_stats.sql
-- Variable Global Statistics View
--
-- Aggregates variable statistics across users who have opted to share their data
-- via OAuth2 clients for the Decentralized FDA platform
--
CREATE MATERIALIZED VIEW global.variable_global_stats AS
WITH authorized_users AS (
    -- Get users who have authorized data sharing via OAuth2
    SELECT DISTINCT up.user_id
    FROM oauth2.clients c
    JOIN oauth2.user_permissions up ON c.id = up.client_id
    WHERE c.is_active = true 
    AND up.scope LIKE '%read_measurements%'
    AND up.revoked_at IS NULL
),
shared_stats AS (
    -- Get stats only from users who have authorized sharing
    SELECT 
        uvs.variable_id,
        COUNT(DISTINCT uvs.user_id) as number_of_users,
        COUNT(*) as number_of_measurements,
        MIN(uvs.minimum_recorded_value) as global_minimum_value,
        MAX(uvs.maximum_recorded_value) as global_maximum_value,
        AVG(uvs.average_value) as average_value_across_users,
        STDDEV(uvs.average_value) as std_dev_between_users,
        AVG(uvs.standard_deviation) as avg_std_dev_within_users,
        MIN(uvs.earliest_measurement) as earliest_measurement,
        MAX(uvs.latest_measurement) as latest_measurement,
        AVG(uvs.number_of_days_with_measurements) as avg_days_with_measurements,
        -- Statistical aggregates
        AVG(CASE WHEN uvs.standard_deviation > 0 THEN uvs.standard_deviation END) as mean_standard_deviation,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY uvs.average_value) as percentile_25,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY uvs.average_value) as median_value,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY uvs.average_value) as percentile_75
    FROM personal.user_variable_stats uvs
    JOIN authorized_users au ON uvs.user_id = au.user_id
    WHERE uvs.number_of_measurements > 0
    GROUP BY uvs.variable_id
),
relationship_stats AS (
    -- Aggregate relationship statistics
    SELECT 
        v.id as variable_id,
        COUNT(DISTINCT CASE WHEN vr.cause_variable_id = v.id THEN vr.id END) as number_of_relationships_as_cause,
        COUNT(DISTINCT CASE WHEN vr.effect_variable_id = v.id THEN vr.id END) as number_of_relationships_as_effect,
        AVG(CASE WHEN vr.cause_variable_id = v.id THEN vr.relationship_strength END) as avg_relationship_strength_as_cause,
        AVG(CASE WHEN vr.effect_variable_id = v.id THEN vr.relationship_strength END) as avg_relationship_strength_as_effect,
        AVG(CASE WHEN vr.cause_variable_id = v.id THEN vr.qm_score END) as avg_qm_score_as_cause,
        AVG(CASE WHEN vr.effect_variable_id = v.id THEN vr.qm_score END) as avg_qm_score_as_effect,
        COUNT(DISTINCT CASE WHEN vr.cause_variable_id = v.id AND vr.relationship_type = 'causation' THEN vr.id END) as number_of_causal_relationships_as_cause,
        COUNT(DISTINCT CASE WHEN vr.effect_variable_id = v.id AND vr.relationship_type = 'causation' THEN vr.id END) as number_of_causal_relationships_as_effect
    FROM reference.variables v
    LEFT JOIN personal.variable_relationships vr ON (v.id = vr.cause_variable_id OR v.id = vr.effect_variable_id)
    JOIN authorized_users au ON vr.user_id = au.user_id
    WHERE vr.status = 'completed'
    AND vr.deleted_at IS NULL
    GROUP BY v.id
)
SELECT 
    v.id as variable_id,
    v.name,
    v.variable_category_id,
    v.default_unit_id,
    v.combination_operation,
    v.filling_type,
    -- User stats
    COALESCE(ss.number_of_users, 0) as number_of_users,
    COALESCE(ss.number_of_measurements, 0) as total_measurements,
    -- Value statistics
    ss.global_minimum_value,
    ss.global_maximum_value,
    ss.average_value_across_users,
    ss.std_dev_between_users,
    ss.avg_std_dev_within_users,
    ss.mean_standard_deviation,
    ss.percentile_25,
    ss.median_value,
    ss.percentile_75,
    -- Temporal stats
    ss.earliest_measurement,
    ss.latest_measurement,
    ss.avg_days_with_measurements,
    -- Relationship stats
    rs.number_of_relationships_as_cause,
    rs.number_of_relationships_as_effect,
    rs.avg_relationship_strength_as_cause,
    rs.avg_relationship_strength_as_effect,
    rs.avg_qm_score_as_cause,
    rs.avg_qm_score_as_effect,
    rs.number_of_causal_relationships_as_cause,
    rs.number_of_causal_relationships_as_effect,
    -- Metadata
    NOW() as last_updated
FROM reference.variables v
LEFT JOIN shared_stats ss ON v.id = ss.variable_id
LEFT JOIN relationship_stats rs ON v.id = rs.variable_id
WHERE v.deleted_at IS NULL;

-- Create indexes for better query performance
CREATE UNIQUE INDEX idx_variable_global_stats_id
ON global.variable_global_stats(variable_id);

CREATE INDEX idx_variable_global_stats_category
ON global.variable_global_stats(variable_category_id);

CREATE INDEX idx_variable_global_stats_measurements
ON global.variable_global_stats(total_measurements DESC);

-- Add comments
COMMENT ON MATERIALIZED VIEW global.variable_global_stats IS 
'Aggregated variable statistics from users who have opted to share their data via OAuth2 clients for the Decentralized FDA platform';

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION global.refresh_variable_global_stats()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY global.variable_global_stats;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh when underlying data changes
CREATE TRIGGER refresh_variable_global_stats_measurements
AFTER INSERT OR UPDATE OR DELETE ON personal.user_variable_stats
FOR EACH STATEMENT EXECUTE FUNCTION global.refresh_variable_global_stats();

CREATE TRIGGER refresh_variable_global_stats_variables
AFTER INSERT OR UPDATE OR DELETE ON reference.variables
FOR EACH STATEMENT EXECUTE FUNCTION global.refresh_variable_global_stats();

CREATE TRIGGER refresh_variable_global_stats_oauth
AFTER INSERT OR UPDATE OR DELETE ON oauth2.user_permissions
FOR EACH STATEMENT EXECUTE FUNCTION global.refresh_variable_global_stats();

CREATE TRIGGER refresh_variable_global_stats_relationships
AFTER INSERT OR UPDATE OR DELETE ON personal.variable_relationships
FOR EACH STATEMENT EXECUTE FUNCTION global.refresh_variable_global_stats(); 

-- Schema: logistics, File: inventory.sql
-- Inventory
CREATE TABLE logistics.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES logistics.warehouses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES commerce.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    reorder_point INTEGER,
    reorder_quantity INTEGER,
    bin_location TEXT,
    last_count_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(warehouse_id, product_id),
    CONSTRAINT valid_quantities CHECK (
        quantity >= 0 AND
        reserved_quantity >= 0 AND
        reserved_quantity <= quantity
    )
);

-- Enable Row Level Security
ALTER TABLE logistics.inventory ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Inventory is viewable by staff"
    ON logistics.inventory FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_logistics'
    ));

CREATE POLICY "Admins can manage inventory"
    ON logistics.inventory FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_logistics'
    )); 

-- Schema: logistics, File: inventory_transactions.sql
-- Inventory Transactions
CREATE TABLE logistics.inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_id UUID NOT NULL REFERENCES logistics.inventory(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('receipt', 'shipment', 'adjustment', 'transfer', 'return')),
    quantity INTEGER NOT NULL,
    reference_type TEXT,
    reference_id UUID,
    notes TEXT,
    performed_by UUID REFERENCES core.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE logistics.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Transactions are viewable by staff"
    ON logistics.inventory_transactions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_logistics'
    ));

CREATE POLICY "Staff can create transactions"
    ON logistics.inventory_transactions FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_logistics'
    )); 

-- Schema: logistics, File: logistics_schema.sql
-- =============================================
-- LOGISTICS SCHEMA - Shipping and Logistics
-- =============================================

CREATE SCHEMA IF NOT EXISTS logistics; 

-- Schema: logistics, File: returns.sql
-- Returns
CREATE TABLE logistics.returns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES commerce.orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES core.profiles(id),
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'received', 'inspected', 'completed', 'rejected')),
    return_reason TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE logistics.returns ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own returns"
    ON logistics.returns FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Staff can view all returns"
    ON logistics.returns FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_logistics'
    ));

CREATE POLICY "Users can create returns"
    ON logistics.returns FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Staff can manage returns"
    ON logistics.returns FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_logistics'
    )); 

-- Schema: logistics, File: return_items.sql
-- Return Items
CREATE TABLE logistics.return_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    return_id UUID NOT NULL REFERENCES logistics.returns(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES commerce.order_items(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    condition TEXT NOT NULL CHECK (condition IN ('new', 'like_new', 'used', 'damaged')),
    reason_details TEXT,
    refund_amount DECIMAL CHECK (refund_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(return_id, order_item_id)
);

-- Enable Row Level Security
ALTER TABLE logistics.return_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own return items"
    ON logistics.return_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM logistics.returns r
        WHERE r.id = return_id
        AND r.user_id = auth.uid()
    ));

CREATE POLICY "Staff can view all return items"
    ON logistics.return_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_logistics'
    ));

CREATE POLICY "Staff can manage return items"
    ON logistics.return_items FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_logistics'
    )); 

-- Schema: logistics, File: shipments.sql
-- Shipments
CREATE TABLE logistics.shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES commerce.orders(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES logistics.warehouses(id),
    shipping_method_id UUID NOT NULL REFERENCES logistics.shipping_methods(id),
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'picked', 'packed', 'shipped', 'delivered', 'cancelled')),
    tracking_number TEXT,
    shipping_label_url TEXT,
    estimated_delivery_date DATE,
    actual_delivery_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE logistics.shipments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own shipments"
    ON logistics.shipments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM commerce.orders o
        WHERE o.id = order_id
        AND o.user_id = auth.uid()
    ));

CREATE POLICY "Staff can view all shipments"
    ON logistics.shipments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_logistics'
    ));

CREATE POLICY "Staff can manage shipments"
    ON logistics.shipments FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_logistics'
    )); 

-- Schema: logistics, File: shipment_items.sql
-- Shipment Items
CREATE TABLE logistics.shipment_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID NOT NULL REFERENCES logistics.shipments(id) ON DELETE CASCADE,
    order_item_id UUID NOT NULL REFERENCES commerce.order_items(id),
    inventory_id UUID NOT NULL REFERENCES logistics.inventory(id),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(shipment_id, order_item_id)
);

-- Enable Row Level Security
ALTER TABLE logistics.shipment_items ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own shipment items"
    ON logistics.shipment_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM logistics.shipments s
        JOIN commerce.orders o ON o.id = s.order_id
        WHERE s.id = shipment_id
        AND o.user_id = auth.uid()
    ));

CREATE POLICY "Staff can view all shipment items"
    ON logistics.shipment_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_logistics'
    ));

CREATE POLICY "Staff can manage shipment items"
    ON logistics.shipment_items FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_logistics'
    )); 

-- Schema: logistics, File: shipping_methods.sql
-- Shipping Methods and Rates
--
-- Defines available shipping methods and their associated rates
-- Used for calculating shipping costs and delivery estimates
--
CREATE TABLE logistics.shipping_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    estimated_days_min INTEGER NOT NULL,
    estimated_days_max INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shipping rates for different zones
CREATE TABLE logistics.shipping_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipping_method_id UUID NOT NULL REFERENCES logistics.shipping_methods(id),
    zone VARCHAR(50) NOT NULL,
    base_rate DECIMAL(10,2) NOT NULL,
    rate_per_kg DECIMAL(10,2) NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(shipping_method_id, zone)
);

-- Seed shipping methods
INSERT INTO logistics.shipping_methods (name, description, estimated_days_min, estimated_days_max, is_active) VALUES
('standard', 'Standard shipping (5-7 business days)', 5, 7, true),
('express', 'Express shipping (2-3 business days)', 2, 3, true),
('overnight', 'Overnight shipping (next business day)', 1, 1, true),
('international', 'International shipping (7-14 business days)', 7, 14, true);

-- Seed shipping rates
INSERT INTO logistics.shipping_rates (shipping_method_id, zone, base_rate, rate_per_kg) VALUES
((SELECT id FROM logistics.shipping_methods WHERE name = 'standard'), 'domestic', 5.99, 0.50),
((SELECT id FROM logistics.shipping_methods WHERE name = 'express'), 'domestic', 12.99, 1.00),
((SELECT id FROM logistics.shipping_methods WHERE name = 'overnight'), 'domestic', 24.99, 2.00),
((SELECT id FROM logistics.shipping_methods WHERE name = 'international'), 'international', 19.99, 3.00);

-- Enable Row Level Security
ALTER TABLE logistics.shipping_methods ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Active shipping methods are viewable by all"
    ON logistics.shipping_methods FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage shipping methods"
    ON logistics.shipping_methods FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_logistics'
    )); 

-- Schema: logistics, File: shipping_rates.sql
-- Shipping Rates
CREATE TABLE logistics.shipping_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipping_method_id UUID NOT NULL REFERENCES logistics.shipping_methods(id) ON DELETE CASCADE,
    min_weight DECIMAL,
    max_weight DECIMAL,
    min_total DECIMAL,
    max_total DECIMAL,
    base_rate DECIMAL NOT NULL CHECK (base_rate >= 0),
    per_item_rate DECIMAL NOT NULL DEFAULT 0 CHECK (per_item_rate >= 0),
    per_weight_rate DECIMAL NOT NULL DEFAULT 0 CHECK (per_weight_rate >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_weight_range CHECK (min_weight IS NULL OR max_weight IS NULL OR min_weight <= max_weight),
    CONSTRAINT valid_total_range CHECK (min_total IS NULL OR max_total IS NULL OR min_total <= max_total)
);

-- Enable Row Level Security
ALTER TABLE logistics.shipping_rates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Shipping rates are viewable by all"
    ON logistics.shipping_rates FOR SELECT
    USING (TRUE);

CREATE POLICY "Admins can manage shipping rates"
    ON logistics.shipping_rates FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_logistics'
    )); 

-- Schema: logistics, File: warehouses.sql
-- Warehouses
CREATE TABLE logistics.warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    address_id UUID NOT NULL REFERENCES core.addresses(id),
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE logistics.warehouses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Active warehouses are viewable by staff"
    ON logistics.warehouses FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_logistics'
    ));

CREATE POLICY "Admins can manage warehouses"
    ON logistics.warehouses FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_logistics'
    )); 

-- Schema: models, File: calculation_views.sql
-- Daily metabolic impact view
CREATE MATERIALIZED VIEW models.daily_metabolic_impact AS
SELECT 
    so.parameter_set_id,
    so.population_segment_id,
    so.intervention_variable_id,
    so.value as muscle_gain_lbs,
    (so.value * p.parameters->>'muscle_calorie_burn_rate')::numeric as calories_per_day,
    ps.confidence_interval_low * (p.parameters->>'muscle_calorie_burn_rate')::numeric as min_calories,
    ps.confidence_interval_high * (p.parameters->>'muscle_calorie_burn_rate')::numeric as max_calories
FROM models.simulation_outputs so
JOIN models.parameter_sets p ON p.id = so.parameter_set_id
JOIN models.parameter_sources ps ON ps.intervention_effect_id = so.id
WHERE so.outcome_variable_id IN (
    SELECT id FROM reference.variables 
    WHERE name = 'muscle_mass_gain'
);

-- Annual metabolic impact view
CREATE MATERIALIZED VIEW models.annual_metabolic_impact AS
SELECT 
    parameter_set_id,
    population_segment_id,
    intervention_variable_id,
    calories_per_day * 365 as calories_per_year,
    min_calories * 365 as min_calories_per_year,
    max_calories * 365 as max_calories_per_year
FROM models.daily_metabolic_impact;

-- Health outcomes view
CREATE MATERIALIZED VIEW models.health_outcomes AS
SELECT 
    so.parameter_set_id,
    so.population_segment_id,
    so.intervention_variable_id,
    v.name as outcome_name,
    so.value as effect_size,
    so.confidence_interval_low as min_effect,
    so.confidence_interval_high as max_effect,
    ie.effect_type,
    ps.citation as source
FROM models.simulation_outputs so
JOIN reference.variables v ON v.id = so.outcome_variable_id
JOIN models.intervention_effects ie ON ie.intervention_variable_id = so.intervention_variable_id
    AND ie.outcome_variable_id = so.outcome_variable_id
JOIN models.parameter_sources ps ON ps.intervention_effect_id = ie.id
WHERE v.name IN ('insulin_sensitivity', 'fall_risk', 'mortality_risk');

-- Cost breakdown view
CREATE MATERIALIZED VIEW models.cost_breakdown_summary AS
SELECT 
    cb.parameter_set_id,
    cb.cost_category,
    cb.subcategory,
    pd.age_group,
    pd.population_count,
    pd.risk_multiplier,
    cb.amount * pd.population_count * pd.risk_multiplier as adjusted_amount,
    cb.percentage_of_total,
    ps.citation as source
FROM models.cost_breakdowns cb
JOIN models.population_demographics pd ON pd.population_segment_id = cb.population_segment_id
JOIN models.parameter_sources ps ON ps.parameter_set_id = cb.parameter_set_id;

-- Total economic impact view
CREATE MATERIALIZED VIEW models.total_economic_impact AS
SELECT 
    parameter_set_id,
    SUM(CASE WHEN cost_category = 'healthcare_savings' THEN adjusted_amount ELSE 0 END) as healthcare_savings,
    SUM(CASE WHEN cost_category = 'productivity_gains' THEN adjusted_amount ELSE 0 END) as productivity_gains,
    SUM(CASE WHEN cost_category = 'qaly_value' THEN adjusted_amount ELSE 0 END) as qaly_value,
    SUM(adjusted_amount) as total_impact
FROM models.cost_breakdown_summary
GROUP BY parameter_set_id;

-- Long term projections view
CREATE MATERIALIZED VIEW models.long_term_projections AS
SELECT 
    cb.parameter_set_id,
    p.time_horizon_years,
    p.discount_rate,
    SUM(cb.adjusted_amount * power(1 + p.discount_rate, -t.year)) as present_value
FROM models.cost_breakdown_summary cb
JOIN models.parameter_sets p ON p.id = cb.parameter_set_id
CROSS JOIN generate_series(1, 10) as t(year)
GROUP BY cb.parameter_set_id, p.time_horizon_years, p.discount_rate;

-- QALY impact view
CREATE MATERIALIZED VIEW models.qaly_impact_summary AS
SELECT 
    so.parameter_set_id,
    so.population_segment_id,
    pd.age_group,
    SUM(so.total_qalys * pd.population_count) as total_qalys,
    SUM(so.qaly_monetary_value * so.total_qalys * pd.population_count) as monetary_value,
    MIN(so.confidence_interval_low) as min_qalys,
    MAX(so.confidence_interval_high) as max_qalys
FROM models.simulation_outputs so
JOIN models.population_demographics pd ON pd.population_segment_id = so.population_segment_id
WHERE so.is_qaly_calculation = true
GROUP BY so.parameter_set_id, so.population_segment_id, pd.age_group;

-- Medicare impact view
CREATE MATERIALIZED VIEW models.medicare_impact_summary AS
SELECT 
    cb.parameter_set_id,
    pd.age_group,
    SUM(cb.adjusted_amount) as savings_amount,
    COUNT(DISTINCT pd.population_count) as beneficiary_count,
    SUM(cb.adjusted_amount) / NULLIF(COUNT(DISTINCT pd.population_count), 0) as savings_per_beneficiary
FROM models.cost_breakdown_summary cb
JOIN models.population_demographics pd ON pd.population_segment_id = cb.population_segment_id
WHERE pd.age_group LIKE '%65%' OR pd.age_group LIKE '%75%' OR pd.age_group LIKE '%85%'
GROUP BY cb.parameter_set_id, pd.age_group;

-- Create indexes for the materialized views
CREATE INDEX ON models.daily_metabolic_impact (parameter_set_id);
CREATE INDEX ON models.health_outcomes (parameter_set_id, outcome_name);
CREATE INDEX ON models.cost_breakdown_summary (parameter_set_id, cost_category);
CREATE INDEX ON models.total_economic_impact (parameter_set_id);
CREATE INDEX ON models.qaly_impact_summary (parameter_set_id, age_group);
CREATE INDEX ON models.medicare_impact_summary (parameter_set_id, age_group);

-- Refresh function for all materialized views
CREATE OR REPLACE FUNCTION models.refresh_all_calculation_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY models.daily_metabolic_impact;
    REFRESH MATERIALIZED VIEW CONCURRENTLY models.annual_metabolic_impact;
    REFRESH MATERIALIZED VIEW CONCURRENTLY models.health_outcomes;
    REFRESH MATERIALIZED VIEW CONCURRENTLY models.cost_breakdown_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY models.total_economic_impact;
    REFRESH MATERIALIZED VIEW CONCURRENTLY models.long_term_projections;
    REFRESH MATERIALIZED VIEW CONCURRENTLY models.qaly_impact_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY models.medicare_impact_summary;
END;
$$ LANGUAGE plpgsql;

-- Base intervention effects view
CREATE MATERIALIZED VIEW models.intervention_outcome_effects AS
SELECT 
    so.parameter_set_id,
    so.population_segment_id,
    so.intervention_variable_id,
    iv.name as intervention_name,
    iv.display_name as intervention_display_name,
    so.outcome_variable_id,
    ov.name as outcome_name,
    ov.display_name as outcome_display_name,
    ov.unit_id,
    u.name as unit_name,
    so.value as effect_size,
    so.confidence_interval_low,
    so.confidence_interval_high,
    ie.effect_type,
    ps.citation as source,
    ps.quality_score as evidence_quality,
    vc.name as variable_category
FROM models.simulation_outputs so
JOIN reference.variables iv ON iv.id = so.intervention_variable_id
JOIN reference.variables ov ON ov.id = so.outcome_variable_id
LEFT JOIN reference.units_of_measurement u ON u.id = ov.unit_id
JOIN models.intervention_effects ie ON ie.intervention_variable_id = so.intervention_variable_id
    AND ie.outcome_variable_id = so.outcome_variable_id
JOIN models.parameter_sources ps ON ps.intervention_effect_id = ie.id
JOIN reference.variable_categories vc ON vc.id = ov.category_id;

-- Population adjusted effects view
CREATE MATERIALIZED VIEW models.population_adjusted_effects AS
SELECT 
    e.*,
    pd.age_group,
    pd.population_count,
    pd.risk_multiplier,
    e.effect_size * pd.population_count * pd.risk_multiplier as population_adjusted_effect,
    e.confidence_interval_low * pd.population_count * pd.risk_multiplier as population_adjusted_min,
    e.confidence_interval_high * pd.population_count * pd.risk_multiplier as population_adjusted_max,
    -- Add time-based calculations
    CASE 
        WHEN e.unit_name LIKE '%per day%' THEN e.effect_size * 365
        WHEN e.unit_name LIKE '%per week%' THEN e.effect_size * 52
        WHEN e.unit_name LIKE '%per month%' THEN e.effect_size * 12
        ELSE e.effect_size
    END as annualized_effect
FROM models.intervention_outcome_effects e
JOIN models.population_demographics pd ON pd.population_segment_id = e.population_segment_id;

-- Cost impacts view with NPV calculations
CREATE MATERIALIZED VIEW models.outcome_cost_impacts AS
SELECT 
    e.*,
    cb.cost_category,
    cb.subcategory,
    cb.amount as base_cost,
    cb.amount * e.population_adjusted_effect as cost_impact,
    cb.percentage_of_total,
    p.time_horizon_years,
    p.discount_rate,
    -- Calculate NPV
    cb.amount * e.population_adjusted_effect * 
    (1 - power(1 + p.discount_rate, -p.time_horizon_years)) / 
    NULLIF(p.discount_rate, 0) as npv_impact
FROM models.population_adjusted_effects e
JOIN models.cost_breakdowns cb ON cb.population_segment_id = e.population_segment_id
    AND cb.parameter_set_id = e.parameter_set_id
JOIN models.parameter_sets p ON p.id = e.parameter_set_id;

-- Cascading effects view
CREATE MATERIALIZED VIEW models.cascading_outcome_effects AS
WITH RECURSIVE outcome_chain AS (
    -- Base case: direct effects
    SELECT 
        ioe.intervention_variable_id,
        ioe.intervention_name,
        ioe.outcome_variable_id as variable_id,
        ioe.outcome_name as variable_name,
        ioe.effect_size,
        ioe.confidence_interval_low,
        ioe.confidence_interval_high,
        ioe.unit_name,
        ioe.variable_category,
        1 as effect_level,
        ARRAY[ioe.outcome_variable_id] as effect_path,
        ioe.evidence_quality as min_evidence_quality,
        ioe.parameter_set_id
    FROM models.intervention_outcome_effects ioe

    UNION ALL

    -- Recursive case: secondary effects
    SELECT 
        oc.intervention_variable_id,
        oc.intervention_name,
        vr.dependent_variable_id,
        v.name as dependent_variable_name,
        oc.effect_size * vr.effect_multiplier as cascaded_effect_size,
        oc.confidence_interval_low * vr.effect_multiplier as cascaded_ci_low,
        oc.confidence_interval_high * vr.effect_multiplier as cascaded_ci_high,
        u.name as unit_name,
        vc.name as variable_category,
        oc.effect_level + 1,
        oc.effect_path || vr.dependent_variable_id,
        LEAST(oc.min_evidence_quality, vr.confidence_level) as min_evidence_quality,
        oc.parameter_set_id
    FROM outcome_chain oc
    JOIN reference.variable_relationships vr ON vr.independent_variable_id = oc.variable_id
    JOIN reference.variables v ON v.id = vr.dependent_variable_id
    LEFT JOIN reference.units_of_measurement u ON u.id = v.unit_id
    JOIN reference.variable_categories vc ON vc.id = v.category_id
    WHERE 
        NOT vr.dependent_variable_id = ANY(oc.effect_path)  -- Prevent cycles
        AND oc.effect_level < 3  -- Limit cascade depth to 3 levels
)
SELECT * FROM outcome_chain;

-- Comprehensive population benefits view
CREATE MATERIALIZED VIEW models.population_benefits AS
SELECT 
    ce.intervention_variable_id,
    ce.intervention_name,
    ce.parameter_set_id,
    pd.age_group,
    pd.population_segment_id,
    -- Outcome effects by category
    jsonb_object_agg(
        ce.variable_name,
        jsonb_build_object(
            'direct_effect', CASE WHEN ce.effect_level = 1 THEN ce.effect_size ELSE NULL END,
            'cascaded_effects', jsonb_agg(
                CASE WHEN ce.effect_level > 1 
                THEN jsonb_build_object(
                    'effect_size', ce.effect_size,
                    'effect_level', ce.effect_level,
                    'unit', ce.unit_name,
                    'evidence_quality', ce.min_evidence_quality,
                    'category', ce.variable_category
                )
                ELSE NULL END
            ) FILTER (WHERE ce.effect_level > 1)
        )
    ) as outcome_effects,
    -- Impacts by category
    SUM(CASE WHEN ce.variable_category = 'health_outcome' THEN ce.effect_size * pd.population_count * pd.risk_multiplier ELSE 0 END) as health_impact,
    SUM(CASE WHEN ce.variable_category = 'biomarker' THEN ce.effect_size * pd.population_count * pd.risk_multiplier ELSE 0 END) as biomarker_impact,
    SUM(CASE WHEN ce.variable_category = 'economic_outcome' THEN ce.effect_size * pd.population_count * pd.risk_multiplier ELSE 0 END) as economic_impact,
    SUM(CASE WHEN ce.variable_category = 'productivity' THEN ce.effect_size * pd.population_count * pd.risk_multiplier ELSE 0 END) as productivity_impact,
    SUM(CASE WHEN ce.variable_name = 'qaly_value' THEN ce.effect_size * pd.population_count * pd.risk_multiplier ELSE 0 END) as qaly_impact,
    -- Cost impacts
    SUM(ci.npv_impact) as total_npv_impact,
    SUM(CASE WHEN ci.cost_category = 'healthcare_savings' THEN ci.npv_impact ELSE 0 END) as healthcare_savings_npv,
    SUM(CASE WHEN ci.cost_category = 'productivity_gains' THEN ci.npv_impact ELSE 0 END) as productivity_gains_npv,
    -- Population metrics
    pd.population_count,
    pd.risk_multiplier,
    -- Evidence quality
    MIN(ce.min_evidence_quality) as min_evidence_quality,
    AVG(ce.min_evidence_quality) as avg_evidence_quality,
    COUNT(DISTINCT ce.variable_id) as outcomes_measured
FROM models.cascading_outcome_effects ce
CROSS JOIN models.population_demographics pd
LEFT JOIN models.outcome_cost_impacts ci ON 
    ci.parameter_set_id = ce.parameter_set_id AND
    ci.population_segment_id = pd.population_segment_id
GROUP BY 
    ce.intervention_variable_id,
    ce.intervention_name,
    ce.parameter_set_id,
    pd.age_group,
    pd.population_segment_id,
    pd.population_count,
    pd.risk_multiplier;

-- Create efficient indexes
CREATE INDEX ON models.intervention_outcome_effects (intervention_variable_id, outcome_variable_id);
CREATE INDEX ON models.intervention_outcome_effects (parameter_set_id);
CREATE INDEX ON models.population_adjusted_effects (intervention_variable_id, age_group);
CREATE INDEX ON models.outcome_cost_impacts (intervention_variable_id, cost_category);
CREATE INDEX ON models.cascading_outcome_effects (intervention_variable_id, variable_id);
CREATE INDEX ON models.cascading_outcome_effects (parameter_set_id, effect_level);
CREATE INDEX ON models.population_benefits (intervention_variable_id, parameter_set_id);
CREATE INDEX ON models.population_benefits (age_group);
CREATE INDEX ON models.population_benefits (population_segment_id);

-- Refresh function
CREATE OR REPLACE FUNCTION models.refresh_all_calculation_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY models.intervention_outcome_effects;
    REFRESH MATERIALIZED VIEW CONCURRENTLY models.population_adjusted_effects;
    REFRESH MATERIALIZED VIEW CONCURRENTLY models.outcome_cost_impacts;
    REFRESH MATERIALIZED VIEW CONCURRENTLY models.cascading_outcome_effects;
    REFRESH MATERIALIZED VIEW CONCURRENTLY models.population_benefits;
END;
$$ LANGUAGE plpgsql; 

-- Schema: models, File: cost_breakdowns.sql
-- Cost breakdowns table for storing detailed cost impacts
CREATE TABLE models.cost_breakdowns (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    simulation_output_id bigint NOT NULL REFERENCES models.simulation_outputs(id),
    cost_category text NOT NULL,
    subcategory text,
    amount numeric NOT NULL,
    percentage_of_total numeric NOT NULL CHECK (percentage_of_total BETWEEN 0 AND 100),
    population_segment_id bigint REFERENCES reference.population_segments(id),
    age_group text,
    calculation_notes text,
    metadata jsonb,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_cost_category CHECK (
        cost_category IN (
            'healthcare_savings',
            'productivity_gains',
            'qaly_value',
            'medicare_impact',
            'long_term_savings'
        )
    )
);

-- Enable row level security
ALTER TABLE models.cost_breakdowns ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON models.cost_breakdowns
    FOR SELECT USING (true);

COMMENT ON TABLE models.cost_breakdowns IS 'Detailed breakdown of costs and savings by category';
COMMENT ON COLUMN models.cost_breakdowns.cost_category IS 'Main cost category (healthcare, productivity, etc.)';
COMMENT ON COLUMN models.cost_breakdowns.subcategory IS 'Specific subcategory of cost (e.g., fall-related, diabetes-related)';
COMMENT ON COLUMN models.cost_breakdowns.amount IS 'Monetary amount in base currency';
COMMENT ON COLUMN models.cost_breakdowns.calculation_notes IS 'Notes explaining how the amount was calculated'; 

-- Schema: models, File: intervention_effects.sql
-- Intervention effects table for storing effect sizes
CREATE TABLE models.intervention_effects (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    intervention_variable_id bigint NOT NULL REFERENCES reference.global_variables(id),
    outcome_variable_id bigint NOT NULL REFERENCES reference.global_variables(id),
    population_segment_id bigint NOT NULL REFERENCES reference.population_segments(id),
    parameter_set_id bigint NOT NULL REFERENCES models.parameter_sets(id),
    effect_type text NOT NULL CHECK (effect_type IN ('relative_risk', 'absolute_change', 'percent_change', 'odds_ratio')),
    effect_size numeric NOT NULL,
    confidence_interval_low numeric,
    confidence_interval_high numeric,
    time_horizon_months integer,
    evidence_level text,
    metadata jsonb,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable row level security
ALTER TABLE models.intervention_effects ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON models.intervention_effects
    FOR SELECT USING (true);

COMMENT ON TABLE models.intervention_effects IS 'Effect sizes of interventions on outcome variables for specific populations';
COMMENT ON COLUMN models.intervention_effects.intervention_variable_id IS 'Reference to the intervention variable';
COMMENT ON COLUMN models.intervention_effects.outcome_variable_id IS 'Reference to the outcome being affected';
COMMENT ON COLUMN models.intervention_effects.effect_type IS 'Type of effect (relative risk, absolute change, etc.)';
COMMENT ON COLUMN models.intervention_effects.time_horizon_months IS 'Time horizon for the effect in months';
COMMENT ON COLUMN models.intervention_effects.evidence_level IS 'Level of evidence supporting the effect size'; 

-- Schema: models, File: models_schema.sql
-- Create models schema for health and economic impact modeling
CREATE SCHEMA IF NOT EXISTS models;

COMMENT ON SCHEMA models IS 'Schema for storing model parameters, simulation runs, and their outputs';
 
-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA models TO authenticated; 

-- Schema: models, File: model_equations.sql
-- Model equations table for storing mathematical relationships
CREATE TABLE models.model_equations (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL UNIQUE,
    display_name text NOT NULL,
    description text,
    equation_type text NOT NULL CHECK (equation_type IN ('differential', 'algebraic', 'statistical', 'machine_learning', 'other')),
    equation_latex text NOT NULL,
    equation_code text,
    input_variables bigint[] NOT NULL, -- Array of global_variables ids used as inputs
    output_variable_id bigint NOT NULL REFERENCES reference.global_variables(id),
    parameter_set_id bigint REFERENCES models.parameter_sets(id),
    validation_rules jsonb,
    metadata jsonb,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_input_variables CHECK (array_length(input_variables, 1) > 0)
);

-- Enable row level security
ALTER TABLE models.model_equations ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON models.model_equations
    FOR SELECT USING (true);

-- Create index for input variables array
CREATE INDEX model_equations_input_vars_idx ON models.model_equations USING GIN (input_variables);

COMMENT ON TABLE models.model_equations IS 'Mathematical equations and relationships used in the models';
COMMENT ON COLUMN models.model_equations.equation_type IS 'Type of equation (differential, algebraic, statistical, etc.)';
COMMENT ON COLUMN models.model_equations.equation_latex IS 'LaTeX representation of the equation';
COMMENT ON COLUMN models.model_equations.equation_code IS 'Computational representation of the equation (e.g. Python/R code)';
COMMENT ON COLUMN models.model_equations.input_variables IS 'Array of global_variables ids used as inputs to the equation';
COMMENT ON COLUMN models.model_equations.output_variable_id IS 'The variable this equation calculates';
COMMENT ON COLUMN models.model_equations.validation_rules IS 'Rules for validating equation inputs and outputs';

-- Create equation dependencies view
CREATE VIEW models.equation_dependencies AS
WITH RECURSIVE deps AS (
    -- Base case: direct dependencies
    SELECT 
        id,
        name,
        input_variables as deps,
        1 as depth
    FROM models.model_equations
    
    UNION ALL
    
    -- Recursive case: dependencies of dependencies
    SELECT 
        d.id,
        d.name,
        array_cat(d.deps, e.input_variables) as deps,
        d.depth + 1 as depth
    FROM deps d
    JOIN models.model_equations e ON ANY(d.deps) = e.output_variable_id
    WHERE d.depth < 10  -- Prevent infinite recursion
)
SELECT DISTINCT ON (id)
    id,
    name,
    deps as all_dependencies,
    depth as dependency_depth
FROM deps
ORDER BY id, depth DESC;

COMMENT ON VIEW models.equation_dependencies IS 'Shows all variable dependencies for each equation, including indirect dependencies'; 

-- Schema: models, File: parameter_sets.sql
-- Parameter sets table for storing named assumption sets
CREATE TABLE models.parameter_sets (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL UNIQUE,
    display_name text NOT NULL,
    description text,
    parameters jsonb NOT NULL,
    scenario_type text NOT NULL CHECK (scenario_type IN ('base', 'best', 'worst')),
    -- Time value parameters
    time_horizon_years integer NOT NULL,
    discount_rate numeric NOT NULL,
    inflation_rate numeric,
    present_value_factor numeric NOT NULL,
    metadata jsonb,
    is_baseline boolean DEFAULT false,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable row level security
ALTER TABLE models.parameter_sets ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON models.parameter_sets
    FOR SELECT USING (true);

COMMENT ON TABLE models.parameter_sets IS 'Named sets of model parameters, assumptions, and time value parameters';
COMMENT ON COLUMN models.parameter_sets.parameters IS 'JSON object containing parameter values';
COMMENT ON COLUMN models.parameter_sets.scenario_type IS 'Whether this is a base, best, or worst case scenario';
COMMENT ON COLUMN models.parameter_sets.time_horizon_years IS 'Time horizon for projections in years';
COMMENT ON COLUMN models.parameter_sets.discount_rate IS 'Annual discount rate for future value calculations';
COMMENT ON COLUMN models.parameter_sets.present_value_factor IS 'Calculated present value factor for the time horizon';
COMMENT ON COLUMN models.parameter_sets.is_baseline IS 'Whether this is a baseline scenario';
COMMENT ON COLUMN models.parameter_sets.metadata IS 'Additional metadata about the parameter set'; 

-- Schema: models, File: parameter_sources.sql
-- Parameter sources table for storing citations and evidence
CREATE TABLE models.parameter_sources (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    parameter_set_id bigint REFERENCES models.parameter_sets(id),
    intervention_effect_id bigint REFERENCES models.intervention_effects(id),
    source_type text NOT NULL CHECK (source_type IN ('paper', 'dataset', 'expert_opinion', 'meta_analysis', 'clinical_trial', 'other')),
    citation text NOT NULL,
    url text,
    doi text,
    publication_date date,
    authors text[],
    quality_score numeric CHECK (quality_score BETWEEN 0 AND 1),
    methodology_notes text,
    limitations text,
    metadata jsonb,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT parameter_source_reference CHECK (
        (parameter_set_id IS NOT NULL AND intervention_effect_id IS NULL) OR
        (parameter_set_id IS NULL AND intervention_effect_id IS NOT NULL)
    )
);

-- Enable row level security
ALTER TABLE models.parameter_sources ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON models.parameter_sources
    FOR SELECT USING (true);

COMMENT ON TABLE models.parameter_sources IS 'Sources and citations for parameter values and effect sizes';
COMMENT ON COLUMN models.parameter_sources.source_type IS 'Type of source (paper, dataset, expert opinion, etc.)';
COMMENT ON COLUMN models.parameter_sources.quality_score IS 'Quality score between 0-1 based on methodology and evidence strength';
COMMENT ON COLUMN models.parameter_sources.methodology_notes IS 'Notes about the methodology used in the source';
COMMENT ON COLUMN models.parameter_sources.limitations IS 'Known limitations or caveats of the source'; 

-- Schema: models, File: population_demographics.sql
-- Population demographics table for storing demographic distributions
CREATE TABLE models.population_demographics (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    population_segment_id bigint NOT NULL REFERENCES reference.population_segments(id),
    parameter_set_id bigint NOT NULL REFERENCES models.parameter_sets(id),
    age_group text NOT NULL,
    percentage numeric NOT NULL CHECK (percentage BETWEEN 0 AND 100),
    risk_multiplier numeric NOT NULL DEFAULT 1.0,
    population_count bigint,
    metadata jsonb,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable row level security
ALTER TABLE models.population_demographics ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON models.population_demographics
    FOR SELECT USING (true);

COMMENT ON TABLE models.population_demographics IS 'Demographic distributions and risk multipliers for population segments';
COMMENT ON COLUMN models.population_demographics.age_group IS 'Age group category (e.g., Under 45, 45-64, etc.)';
COMMENT ON COLUMN models.population_demographics.percentage IS 'Percentage of population in this demographic group';
COMMENT ON COLUMN models.population_demographics.risk_multiplier IS 'Risk multiplier for this demographic group';
COMMENT ON COLUMN models.population_demographics.population_count IS 'Absolute count of population in this demographic group'; 

-- Schema: models, File: simulation_outputs.sql
-- Simulation outputs table for storing model results
CREATE TABLE models.simulation_outputs (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    run_name text NOT NULL,
    run_timestamp timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    parameter_set_id bigint NOT NULL REFERENCES models.parameter_sets(id),
    population_segment_id bigint NOT NULL REFERENCES reference.population_segments(id),
    intervention_variable_id bigint NOT NULL REFERENCES reference.global_variables(id),
    outcome_variable_id bigint NOT NULL REFERENCES reference.global_variables(id),
    time_point timestamptz NOT NULL,
    value numeric NOT NULL,
    -- QALY specific fields
    is_qaly_calculation boolean DEFAULT false,
    qaly_type text CHECK (
        NOT is_qaly_calculation OR 
        qaly_type IN ('lifetime', 'annual', 'incremental')
    ),
    base_life_expectancy numeric,
    quality_adjustment_factor numeric CHECK (
        NOT is_qaly_calculation OR 
        quality_adjustment_factor BETWEEN 0 AND 1
    ),
    total_qalys numeric,
    qaly_monetary_value numeric,
    -- Common fields
    confidence_interval_low numeric,
    confidence_interval_high numeric,
    calculation_method text,
    assumptions text[],
    limitations text,
    metadata jsonb,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_qaly_fields CHECK (
        (is_qaly_calculation AND qaly_type IS NOT NULL AND base_life_expectancy IS NOT NULL 
         AND quality_adjustment_factor IS NOT NULL AND total_qalys IS NOT NULL 
         AND qaly_monetary_value IS NOT NULL)
        OR
        (NOT is_qaly_calculation AND qaly_type IS NULL AND base_life_expectancy IS NULL 
         AND quality_adjustment_factor IS NULL AND total_qalys IS NULL 
         AND qaly_monetary_value IS NULL)
    )
);

-- Enable row level security
ALTER TABLE models.simulation_outputs ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON models.simulation_outputs
    FOR SELECT USING (true);

-- Create index for time series queries
CREATE INDEX simulation_outputs_time_idx ON models.simulation_outputs (time_point);

-- Create index for QALY calculations
CREATE INDEX simulation_outputs_qaly_idx ON models.simulation_outputs (is_qaly_calculation) WHERE is_qaly_calculation;

COMMENT ON TABLE models.simulation_outputs IS 'Results from model simulations including projected outcomes and QALY calculations';
COMMENT ON COLUMN models.simulation_outputs.run_name IS 'Name/identifier for the simulation run';
COMMENT ON COLUMN models.simulation_outputs.value IS 'Projected value of the outcome variable at the given time point';
COMMENT ON COLUMN models.simulation_outputs.is_qaly_calculation IS 'Whether this row represents a QALY calculation';
COMMENT ON COLUMN models.simulation_outputs.qaly_type IS 'Type of QALY calculation (lifetime, annual, or incremental)';
COMMENT ON COLUMN models.simulation_outputs.quality_adjustment_factor IS 'Factor used to adjust life years for quality';
COMMENT ON COLUMN models.simulation_outputs.qaly_monetary_value IS 'Monetary value assigned to each QALY';
COMMENT ON COLUMN models.simulation_outputs.metadata IS 'Additional metadata about the simulation output'; 

-- Schema: models, File: statistical_validation.sql
-- Statistical validation table for storing analysis methods and covariates
CREATE TABLE models.statistical_validation (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    simulation_output_id bigint NOT NULL REFERENCES models.simulation_outputs(id),
    analysis_method text NOT NULL,
    covariates text[] NOT NULL,
    statistical_tests jsonb NOT NULL,
    confidence_level numeric NOT NULL CHECK (confidence_level BETWEEN 0 AND 1),
    p_value numeric,
    sample_size bigint,
    power_analysis jsonb,
    methodology_notes text,
    limitations text,
    metadata jsonb,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_analysis_method CHECK (
        analysis_method IN (
            'poisson_regression',
            'cox_proportional_hazards',
            'linear_regression',
            'logistic_regression',
            'mixed_effects_model',
            'other'
        )
    )
);

-- Enable row level security
ALTER TABLE models.statistical_validation ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON models.statistical_validation
    FOR SELECT USING (true);

COMMENT ON TABLE models.statistical_validation IS 'Statistical validation methods and results for model outputs';
COMMENT ON COLUMN models.statistical_validation.analysis_method IS 'Statistical method used for analysis';
COMMENT ON COLUMN models.statistical_validation.covariates IS 'Array of covariates included in the analysis';
COMMENT ON COLUMN models.statistical_validation.statistical_tests IS 'JSON object containing test results';
COMMENT ON COLUMN models.statistical_validation.power_analysis IS 'Power analysis results and parameters';
COMMENT ON COLUMN models.statistical_validation.methodology_notes IS 'Notes about the statistical methodology';
COMMENT ON COLUMN models.statistical_validation.limitations IS 'Known limitations of the statistical analysis'; 

-- Schema: oauth2, File: access_tokens.sql
-- OAuth2 Access Tokens
CREATE TABLE oauth2.access_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT NOT NULL UNIQUE,
    client_id UUID NOT NULL REFERENCES oauth2.clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    scope TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE oauth2.access_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own access tokens"
    ON oauth2.access_tokens FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all access tokens"
    ON oauth2.access_tokens FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_oauth2'
    )); 

-- Schema: oauth2, File: authorization_codes.sql
-- OAuth2 Authorization Codes
CREATE TABLE oauth2.authorization_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    client_id UUID NOT NULL REFERENCES oauth2.clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    redirect_uri TEXT NOT NULL,
    scope TEXT,
    code_challenge TEXT,
    code_challenge_method TEXT CHECK (code_challenge_method IN ('plain', 'S256')),
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE oauth2.authorization_codes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own authorization codes"
    ON oauth2.authorization_codes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all authorization codes"
    ON oauth2.authorization_codes FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_oauth2'
    )); 

-- Schema: oauth2, File: clients.sql
-- OAuth2 Clients
CREATE TABLE oauth2.clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id TEXT NOT NULL UNIQUE,
    client_secret TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    homepage_url TEXT,
    logo_url TEXT,
    redirect_uris TEXT[] NOT NULL,
    grant_types TEXT[] NOT NULL,
    response_types TEXT[] NOT NULL,
    scope TEXT,
    owner_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    is_confidential BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE oauth2.clients ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own OAuth2 clients"
    ON oauth2.clients FOR SELECT
    USING (auth.uid() = owner_id);

CREATE POLICY "Users can manage their own OAuth2 clients"
    ON oauth2.clients FOR ALL
    USING (auth.uid() = owner_id);

CREATE POLICY "Staff can view all OAuth2 clients"
    ON oauth2.clients FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_oauth2'
    ));

CREATE POLICY "Staff can manage OAuth2 clients"
    ON oauth2.clients FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_oauth2'
    )); 

-- Schema: oauth2, File: oauth2_schema.sql
-- =============================================
-- OAUTH2 SCHEMA - OAuth2 Authorization Server
-- =============================================

CREATE SCHEMA IF NOT EXISTS oauth2; 

-- Schema: oauth2, File: refresh_tokens.sql
-- OAuth2 Refresh Tokens
CREATE TABLE oauth2.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT NOT NULL UNIQUE,
    access_token_id UUID NOT NULL REFERENCES oauth2.access_tokens(id) ON DELETE CASCADE,
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE oauth2.refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own refresh tokens"
    ON oauth2.refresh_tokens FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM oauth2.access_tokens at
        WHERE at.id = access_token_id
        AND at.user_id = auth.uid()
    ));

CREATE POLICY "Staff can view all refresh tokens"
    ON oauth2.refresh_tokens FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_oauth2'
    )); 

-- Schema: oauth2, File: user_consents.sql
-- OAuth2 User Consents
CREATE TABLE oauth2.user_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES oauth2.clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    scope TEXT NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(client_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE oauth2.user_consents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own consents"
    ON oauth2.user_consents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own consents"
    ON oauth2.user_consents FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Staff can view all consents"
    ON oauth2.user_consents FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'view_oauth2'
    ));

CREATE POLICY "Staff can manage all consents"
    ON oauth2.user_consents FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_oauth2'
    )); 

-- Schema: personal, File: client_data_functions.sql
-- Function to process client data
CREATE OR REPLACE FUNCTION personal.process_client_data(
    p_client_id text,
    p_user_id uuid,
    p_data jsonb,
    p_source_type text DEFAULT 'client_data'
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    v_source_id uuid;
    v_result jsonb;
    v_measurements_count integer := 0;
    v_conditions_count integer := 0;
    v_medications_count integer := 0;
    v_lab_results_count integer := 0;
BEGIN
    -- Get or create data source
    INSERT INTO reference.data_sources (
        source_type,
        client_id,
        name,
        description,
        metadata
    )
    VALUES (
        p_source_type,
        p_client_id,
        'Client: ' || p_client_id,
        'Data from client ' || p_client_id,
        p_data->'metadata'
    )
    ON CONFLICT (client_id) WHERE source_type = p_source_type
    DO UPDATE SET
        updated_at = CURRENT_TIMESTAMP,
        metadata = EXCLUDED.metadata
    RETURNING id INTO v_source_id;

    -- Process measurements
    IF p_data ? 'measurements' AND jsonb_typeof(p_data->'measurements') = 'array' THEN
        INSERT INTO personal.variable_measurements (
            user_id,
            variable_id,
            value,
            unit_id,
            measurement_time,
            source,
            source_id,
            notes,
            is_estimated,
            metadata
        )
        SELECT
            p_user_id,
            (m->>'variable_id')::uuid,
            (m->>'value')::numeric,
            (m->>'unit_id')::uuid,
            COALESCE(
                (m->>'measurement_time')::timestamp with time zone,
                CURRENT_TIMESTAMP
            ),
            p_source_type,
            v_source_id,
            m->>'notes',
            COALESCE((m->>'is_estimated')::boolean, false),
            m->'metadata'
        FROM jsonb_array_elements(p_data->'measurements') m
        WHERE m->>'variable_id' IS NOT NULL
        AND m->>'value' IS NOT NULL
        AND m->>'unit_id' IS NOT NULL;

        GET DIAGNOSTICS v_measurements_count = ROW_COUNT;
    END IF;

    -- Process conditions
    IF p_data ? 'conditions' AND jsonb_typeof(p_data->'conditions') = 'array' THEN
        INSERT INTO personal.conditions (
            user_id,
            variable_id,
            onset_date,
            resolution_date,
            status,
            diagnosis_type,
            notes,
            metadata
        )
        SELECT
            p_user_id,
            (c->>'variable_id')::uuid,
            COALESCE(
                (c->>'onset_date')::timestamp with time zone,
                CURRENT_TIMESTAMP
            ),
            (c->>'resolution_date')::timestamp with time zone,
            COALESCE(c->>'status', 'active'),
            COALESCE(c->>'diagnosis_type', 'self_reported'),
            c->>'notes',
            c->'metadata'
        FROM jsonb_array_elements(p_data->'conditions') c
        WHERE c->>'variable_id' IS NOT NULL;

        GET DIAGNOSTICS v_conditions_count = ROW_COUNT;
    END IF;

    -- Process medications
    IF p_data ? 'medications' AND jsonb_typeof(p_data->'medications') = 'array' THEN
        INSERT INTO personal.medications (
            user_id,
            variable_id,
            dosage,
            unit_id,
            start_date,
            end_date,
            status,
            notes,
            metadata
        )
        SELECT
            p_user_id,
            (m->>'variable_id')::uuid,
            (m->>'dosage')::numeric,
            (m->>'unit_id')::uuid,
            COALESCE(
                (m->>'start_date')::timestamp with time zone,
                CURRENT_TIMESTAMP
            ),
            (m->>'end_date')::timestamp with time zone,
            COALESCE(m->>'status', 'active'),
            m->>'notes',
            m->'metadata'
        FROM jsonb_array_elements(p_data->'medications') m
        WHERE m->>'variable_id' IS NOT NULL;

        GET DIAGNOSTICS v_medications_count = ROW_COUNT;
    END IF;

    -- Process lab results
    IF p_data ? 'lab_results' AND jsonb_typeof(p_data->'lab_results') = 'array' THEN
        INSERT INTO personal.lab_results (
            user_id,
            lab_test_id,
            value,
            unit_id,
            test_date,
            notes,
            metadata
        )
        SELECT
            p_user_id,
            (l->>'lab_test_id')::uuid,
            (l->>'value')::numeric,
            (l->>'unit_id')::uuid,
            COALESCE(
                (l->>'test_date')::timestamp with time zone,
                CURRENT_TIMESTAMP
            ),
            l->>'notes',
            l->'metadata'
        FROM jsonb_array_elements(p_data->'lab_results') l
        WHERE l->>'lab_test_id' IS NOT NULL
        AND l->>'value' IS NOT NULL
        AND l->>'unit_id' IS NOT NULL;

        GET DIAGNOSTICS v_lab_results_count = ROW_COUNT;
    END IF;

    -- Build result
    v_result := jsonb_build_object(
        'source_id', v_source_id,
        'measurements_count', v_measurements_count,
        'conditions_count', v_conditions_count,
        'medications_count', v_medications_count,
        'lab_results_count', v_lab_results_count
    );

    RETURN v_result;
END;
$$; 

-- Schema: personal, File: communication_functions.sql
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

-- Schema: personal, File: communication_messages.sql
-- Communication Messages
--
-- User-specific communication transcripts and messages
-- Stores all types of communication including AI, human, and system messages
--
CREATE TABLE IF NOT EXISTS personal.communication_messages (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id uuid NOT NULL REFERENCES personal.check_in_sessions(id) ON DELETE CASCADE,
    message_type text NOT NULL CHECK (message_type IN ('system', 'user', 'ai', 'human_agent')),
    content text NOT NULL,
    sent_at timestamptz NOT NULL DEFAULT now(),
    delivered_at timestamptz,
    read_at timestamptz,
    metadata jsonb, -- Store channel-specific metadata (e.g., SMS delivery status, call recording URL)
    parent_message_id uuid REFERENCES personal.communication_messages(id), -- For threaded conversations
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create index for faster transcript retrieval
CREATE INDEX idx_communication_messages_session_time 
    ON personal.communication_messages (session_id, sent_at);

-- Add RLS policies
ALTER TABLE personal.communication_messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages
CREATE POLICY "Users can view their own messages"
    ON personal.communication_messages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM personal.check_in_sessions cs
        WHERE cs.id = session_id AND cs.user_id = auth.uid()
    ));

-- System can insert messages
CREATE POLICY "System can insert messages"
    ON personal.communication_messages FOR INSERT
    USING (true);

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

-- Schema: personal, File: communication_transcripts.sql
-- Communication Transcripts View
--
-- Provides a consolidated view of communication sessions with all messages
-- Includes various types of interactions: doctor appointments, check-ins,
-- AI conversations, human agent interactions, etc.
--
CREATE VIEW personal.communication_transcripts AS
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

-- Schema: personal, File: data_imports.sql
-- Create tables for data imports and processing
CREATE TABLE IF NOT EXISTS personal.data_imports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    file_name text NOT NULL,
    file_type text NOT NULL CHECK (file_type IN ('spreadsheet', 'pdf', 'image', 'receipt', 'json', 'xml', 'text')),
    mime_type text NOT NULL,
    file_size integer NOT NULL,
    storage_path text NOT NULL, -- Path in storage bucket
    preview_path text, -- Path to generated preview/thumbnail
    ocr_text text, -- Extracted text content
    original_hash text NOT NULL, -- For deduplication and integrity
    import_type text NOT NULL CHECK (import_type IN ('measurements', 'conditions', 'medications', 'lab_results', 'receipts', 'mixed')),
    processing_status text NOT NULL DEFAULT 'pending' 
        CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'needs_review')),
    processing_error text,
    processing_metadata jsonb, -- Store AI processing details, confidence scores, etc.
    processed_at timestamptz,
    review_status text CHECK (review_status IN ('pending', 'approved', 'rejected', 'modified')),
    reviewed_by uuid REFERENCES core.profiles(id) ON DELETE SET NULL,
    review_notes text,
    retention_required boolean DEFAULT false, -- Flag for compliance/legal holds
    retention_until timestamptz, -- Optional retention end date
    access_level text DEFAULT 'private' CHECK (access_level IN ('private', 'shared', 'public')),
    shared_with jsonb, -- Array of user_ids or group_ids with access
    tags text[], -- Flexible tagging for organization
    document_date timestamptz, -- When the document was originally created/issued
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz -- Soft delete support
);

-- Add indexes for common queries
CREATE INDEX idx_data_imports_user_id ON personal.data_imports(user_id);
CREATE INDEX idx_data_imports_file_type ON personal.data_imports(file_type);
CREATE INDEX idx_data_imports_import_type ON personal.data_imports(import_type);
CREATE INDEX idx_data_imports_processing_status ON personal.data_imports(processing_status);
CREATE INDEX idx_data_imports_tags ON personal.data_imports USING gin(tags);
CREATE INDEX idx_data_imports_document_date ON personal.data_imports(document_date);
CREATE INDEX idx_data_imports_deleted_at ON personal.data_imports(deleted_at);

-- Add RLS policies
ALTER TABLE personal.data_imports ENABLE ROW LEVEL SECURITY;

-- Users can view their own imports and shared/public imports
CREATE POLICY "Users can view accessible imports"
    ON personal.data_imports FOR SELECT
    USING (
        deleted_at IS NULL AND (
            auth.uid() = user_id 
            OR access_level = 'public'
            OR (
                access_level = 'shared' 
                AND (
                    shared_with->>'user_ids' ? auth.uid()::text
                    OR EXISTS (
                        SELECT 1 FROM core.user_groups ug
                        WHERE ug.user_id = auth.uid()
                        AND shared_with->>'group_ids' ? ug.group_id::text
                    )
                )
            )
        )
    );

-- Users can create their own imports
CREATE POLICY "Users can create their own imports"
    ON personal.data_imports FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own imports
CREATE POLICY "Users can update their own imports"
    ON personal.data_imports FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can soft delete their own imports
CREATE POLICY "Users can soft delete their own imports"
    ON personal.data_imports FOR UPDATE
    USING (auth.uid() = user_id AND deleted_at IS NULL)
    WITH CHECK (auth.uid() = user_id AND deleted_at IS NOT NULL); 

-- Schema: personal, File: extracted_data_points.sql
-- Table to store extracted data points before they're verified and imported
CREATE TABLE IF NOT EXISTS personal.extracted_data_points (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_id uuid NOT NULL REFERENCES personal.data_imports(id) ON DELETE CASCADE,
    data_type text NOT NULL CHECK (data_type IN ('measurement', 'condition', 'medication', 'lab_result', 'receipt')),
    variable_id uuid REFERENCES medical_ref.variables(id) ON DELETE CASCADE,
    extracted_value text NOT NULL,
    parsed_value decimal,
    unit_id uuid REFERENCES medical_ref.units_of_measurement(id) ON DELETE RESTRICT,
    timestamp timestamptz,
    confidence_score decimal CHECK (confidence_score BETWEEN 0 AND 1),
    requires_review boolean DEFAULT false,
    review_status text DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'modified')),
    reviewed_by uuid REFERENCES core.profiles(id) ON DELETE SET NULL,
    review_notes text,
    source_coordinates jsonb, -- Store location in original file (e.g., cell coordinates, PDF coordinates)
    metadata jsonb, -- Additional extracted context
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add RLS policies
ALTER TABLE personal.extracted_data_points ENABLE ROW LEVEL SECURITY;

-- Users can view extracted data from accessible imports
CREATE POLICY "Users can view extracted data from accessible imports"
    ON personal.extracted_data_points FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM personal.data_imports di
        WHERE di.id = import_id 
        AND di.deleted_at IS NULL
        AND (
            di.user_id = auth.uid() 
            OR di.access_level = 'public'
            OR (
                di.access_level = 'shared' 
                AND (
                    di.shared_with->>'user_ids' ? auth.uid()::text
                    OR EXISTS (
                        SELECT 1 FROM core.user_groups ug
                        WHERE ug.user_id = auth.uid()
                        AND di.shared_with->>'group_ids' ? ug.group_id::text
                    )
                )
            )
        )
    )); 

-- Schema: personal, File: import_processing_functions.sql
-- Function to process approved data points
CREATE OR REPLACE FUNCTION personal.process_approved_data_points(
    p_import_id uuid,
    p_reviewed_by uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    v_processed_count integer := 0;
    v_source_id uuid;
BEGIN
    -- Get or create data source for this import
    INSERT INTO reference.data_sources (
        source_type,
        import_id,
        name,
        description,
        metadata
    )
    SELECT 
        'data_import',
        di.id,
        'Import: ' || di.file_name,
        'Data imported from ' || di.file_type || ' file',
        jsonb_build_object(
            'file_type', di.file_type,
            'mime_type', di.mime_type,
            'import_type', di.import_type
        )
    FROM personal.data_imports di
    WHERE di.id = p_import_id
    ON CONFLICT (import_id) WHERE source_type = 'data_import'
    DO UPDATE SET
        updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_source_id;

    -- Process measurements with source_id
    INSERT INTO personal.variable_measurements (
        user_id,
        variable_id,
        value,
        unit_id,
        measurement_time,
        source,
        source_id,
        notes,
        is_estimated
    )
    SELECT 
        di.user_id,
        edp.variable_id,
        edp.parsed_value,
        edp.unit_id,
        COALESCE(edp.timestamp, di.created_at),
        'data_import',
        v_source_id,
        'Imported from ' || di.file_name || CASE 
            WHEN edp.source_coordinates IS NOT NULL 
            THEN ' at ' || edp.source_coordinates::text
            ELSE ''
        END,
        edp.confidence_score < 0.9
    FROM personal.extracted_data_points edp
    JOIN personal.data_imports di ON edp.import_id = di.id
    WHERE edp.import_id = p_import_id
    AND edp.data_type = 'measurement'
    AND edp.review_status = 'approved';

    GET DIAGNOSTICS v_processed_count = ROW_COUNT;

    -- Process conditions
    INSERT INTO personal.conditions (
        user_id,
        variable_id,
        onset_date,
        status,
        diagnosis_type,
        notes
    )
    SELECT 
        di.user_id,
        edp.variable_id,
        COALESCE(edp.timestamp, di.created_at),
        'active',
        'self_reported',
        'Imported from ' || di.file_name || CASE 
            WHEN edp.source_coordinates IS NOT NULL 
            THEN ' at ' || edp.source_coordinates::text
            ELSE ''
        END
    FROM personal.extracted_data_points edp
    JOIN personal.data_imports di ON edp.import_id = di.id
    WHERE edp.import_id = p_import_id
    AND edp.data_type = 'condition'
    AND edp.review_status = 'approved';

    GET DIAGNOSTICS v_processed_count = v_processed_count + ROW_COUNT;

    -- Process medications
    INSERT INTO personal.medications (
        user_id,
        variable_id,
        dosage,
        unit_id,
        start_date,
        status,
        notes
    )
    SELECT 
        di.user_id,
        edp.variable_id,
        edp.parsed_value,
        edp.unit_id,
        COALESCE(edp.timestamp, di.created_at),
        'active',
        'Imported from ' || di.file_name || CASE 
            WHEN edp.source_coordinates IS NOT NULL 
            THEN ' at ' || edp.source_coordinates::text
            ELSE ''
        END
    FROM personal.extracted_data_points edp
    JOIN personal.data_imports di ON edp.import_id = di.id
    WHERE edp.import_id = p_import_id
    AND edp.data_type = 'medication'
    AND edp.review_status = 'approved';

    GET DIAGNOSTICS v_processed_count = v_processed_count + ROW_COUNT;

    -- Process lab results
    INSERT INTO personal.lab_results (
        user_id,
        lab_test_id,
        value,
        unit_id,
        test_date,
        notes
    )
    SELECT 
        di.user_id,
        edp.variable_id,
        edp.parsed_value,
        edp.unit_id,
        COALESCE(edp.timestamp, di.created_at),
        'Imported from ' || di.file_name || CASE 
            WHEN edp.source_coordinates IS NOT NULL 
            THEN ' at ' || edp.source_coordinates::text
            ELSE ''
        END
    FROM personal.extracted_data_points edp
    JOIN personal.data_imports di ON edp.import_id = di.id
    WHERE edp.import_id = p_import_id
    AND edp.data_type = 'lab_result'
    AND edp.review_status = 'approved';

    GET DIAGNOSTICS v_processed_count = v_processed_count + ROW_COUNT;

    -- Update import status
    UPDATE personal.data_imports
    SET 
        processing_status = 'completed',
        processed_at = CURRENT_TIMESTAMP,
        reviewed_by = p_reviewed_by
    WHERE id = p_import_id;

    RETURN v_processed_count;
END;
$$;

-- Function to soft delete an import and its data
CREATE OR REPLACE FUNCTION personal.soft_delete_import(
    p_import_id uuid,
    p_deletion_note text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if retention is required
    IF EXISTS (
        SELECT 1 FROM personal.data_imports
        WHERE id = p_import_id
        AND retention_required = true
        AND (retention_until IS NULL OR retention_until > CURRENT_TIMESTAMP)
    ) THEN
        RAISE EXCEPTION 'Cannot delete import: retention required';
    END IF;

    -- Soft delete the import
    UPDATE personal.data_imports
    SET 
        deleted_at = CURRENT_TIMESTAMP,
        review_notes = CASE 
            WHEN review_notes IS NULL THEN p_deletion_note
            ELSE review_notes || E'\n' || p_deletion_note
        END
    WHERE id = p_import_id
    AND deleted_at IS NULL;
END;
$$; 

-- Schema: personal, File: import_statistics.sql
-- Create view for import status and statistics
CREATE OR REPLACE VIEW personal.import_statistics AS
SELECT 
    di.id as import_id,
    di.user_id,
    di.file_name,
    di.file_type,
    di.import_type,
    di.processing_status,
    di.processed_at,
    di.retention_required,
    di.retention_until,
    di.access_level,
    di.document_date,
    COUNT(edp.id) as total_data_points,
    COUNT(edp.id) FILTER (WHERE edp.confidence_score >= 0.9) as high_confidence_points,
    COUNT(edp.id) FILTER (WHERE edp.requires_review) as points_requiring_review,
    COUNT(edp.id) FILTER (WHERE edp.review_status = 'approved') as approved_points,
    COUNT(edp.id) FILTER (WHERE edp.review_status = 'rejected') as rejected_points,
    MIN(edp.confidence_score) as min_confidence,
    AVG(edp.confidence_score) as avg_confidence,
    MAX(edp.confidence_score) as max_confidence,
    array_length(di.tags, 1) as tag_count
FROM personal.data_imports di
LEFT JOIN personal.extracted_data_points edp ON di.id = edp.import_id
WHERE di.deleted_at IS NULL
GROUP BY di.id, di.user_id, di.file_name, di.file_type, di.import_type, 
         di.processing_status, di.processed_at, di.retention_required, 
         di.retention_until, di.access_level, di.document_date, di.tags; 

-- Schema: personal, File: measurements.sql
-- Measurements Table
--
-- Stores individual measurements/data points for user variables
-- This is the base table that user and global statistics are calculated from
--
CREATE TABLE personal.measurements (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES core.profiles(id),
    variable_id bigint NOT NULL REFERENCES reference.variables(id),
    value numeric NOT NULL,
    unit_id bigint REFERENCES reference.units_of_measurement(id),
    source_type text NOT NULL CHECK (source_type IN ('manual', 'import', 'api', 'device', 'calculation')),
    source_id text,                    -- External identifier for imported/API data
    timestamp timestamptz NOT NULL,    -- When the measurement was taken
    timezone text,                     -- User's timezone when measurement was taken
    location point,                    -- Optional location data
    notes text,                        -- Any additional notes
    metadata jsonb,                    -- Flexible metadata storage
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX idx_measurements_user_variable 
ON personal.measurements(user_id, variable_id);

CREATE INDEX idx_measurements_timestamp 
ON personal.measurements(timestamp);

CREATE INDEX idx_measurements_source 
ON personal.measurements(source_type, source_id);

-- Enable RLS
ALTER TABLE personal.measurements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own measurements"
    ON personal.measurements FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own measurements"
    ON personal.measurements FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own measurements"
    ON personal.measurements FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own measurements"
    ON personal.measurements FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

COMMENT ON TABLE personal.measurements IS 'Stores individual measurements/data points for user variables';
COMMENT ON COLUMN personal.measurements.value IS 'The actual measurement value';
COMMENT ON COLUMN personal.measurements.source_type IS 'How the measurement was recorded (manual, import, api, device, calculation)';
COMMENT ON COLUMN personal.measurements.source_id IS 'External identifier for imported or API data';
COMMENT ON COLUMN personal.measurements.timestamp IS 'When the measurement was taken';
COMMENT ON COLUMN personal.measurements.timezone IS 'User''s timezone when measurement was taken';
COMMENT ON COLUMN personal.measurements.metadata IS 'Flexible storage for additional measurement metadata'; 

-- Schema: personal, File: measurement_sources.sql
-- Create a view to see measurement sources with context
CREATE OR REPLACE VIEW personal.measurement_sources AS
SELECT 
    m.id as measurement_id,
    m.user_id,
    m.variable_id,
    m.measurement_time,
    ds.source_type,
    ds.name as source_name,
    ds.description as source_description,
    CASE ds.source_type
        WHEN 'data_import' THEN jsonb_build_object(
            'file_name', di.file_name,
            'file_type', di.file_type,
            'import_type', di.import_type
        )
        WHEN 'oauth_client' THEN jsonb_build_object(
            'client_name', c.name,
            'client_id', c.id
        )
        WHEN 'integration' THEN ds.metadata
        WHEN 'device' THEN jsonb_build_object(
            'device_id', ds.device_id,
            'metadata', ds.metadata
        )
        ELSE ds.metadata
    END as source_details
FROM personal.variable_measurements m
JOIN reference.data_sources ds ON m.source_id = ds.id
LEFT JOIN personal.data_imports di ON ds.import_id = di.id
LEFT JOIN oauth2.clients c ON ds.client_id = c.id; 

-- Schema: personal, File: n1_trial_phases.sql
-- Create tables for N-1 trial tracking and analysis
CREATE TABLE IF NOT EXISTS personal.n1_trial_phases (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    variable_id uuid NOT NULL REFERENCES medical_ref.variables(id) ON DELETE CASCADE,
    start_date timestamptz NOT NULL,
    end_date timestamptz,
    phase_type text NOT NULL CHECK (phase_type IN (
        'pre_treatment',    -- Initial baseline
        'washout',         -- Medication-free period
        'stable_period',   -- Stable baseline
        'experimental',    -- Treatment/intervention period
        'crossover',       -- When switching between conditions
        'follow_up'        -- Post-intervention monitoring
    )),
    phase_order integer, -- For ordering phases in crossover designs
    comparison_phase_id uuid REFERENCES personal.n1_trial_phases(id), -- For explicit phase comparisons
    
    -- Intervention details (for experimental phases)
    intervention_variable_id uuid REFERENCES medical_ref.variables(id), -- What's being tested
    target_dosage numeric,
    target_frequency text,
    schedule jsonb, -- Detailed timing/protocol schedule
    prescription_details jsonb, -- For medications: prescriber, pharmacy, rx number
    
    -- Tracking and Analysis
    adherence_rate numeric CHECK (adherence_rate >= 0 AND adherence_rate <= 100),
    side_effects jsonb,
    effectiveness_rating integer CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
    cost_per_unit numeric,
    total_cost numeric,
    
    -- Protocol and Notes
    phase_protocol jsonb, -- Overall phase protocol including measurement schedule
    notes text,
    deleted_at timestamptz, -- Soft delete support
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date > start_date),
    -- Ensure intervention details for experimental phases
    CONSTRAINT intervention_required CHECK (
        (phase_type = 'experimental' AND intervention_variable_id IS NOT NULL) OR
        (phase_type != 'experimental' AND intervention_variable_id IS NULL)
    ),
    -- Ensure unique trial phases per user/variable/intervention combination
    CONSTRAINT unique_user_trial_phase UNIQUE NULLS NOT DISTINCT 
        (user_id, variable_id, intervention_variable_id, start_date, phase_type)
);

-- Create view for severity changes (replacing table)
CREATE OR REPLACE VIEW personal.n1_trial_severity_changes AS
WITH BaselineStats AS (
    SELECT 
        tp.id AS reference_phase_id,
        tp.user_id,
        tp.variable_id,
        AVG(vm.value) AS reference_value,
        STDDEV(vm.value) AS reference_stddev
    FROM personal.n1_trial_phases tp
    JOIN personal.variable_measurements vm ON 
        tp.user_id = vm.user_id AND 
        tp.variable_id = vm.variable_id AND
        vm.measurement_time BETWEEN tp.start_date AND COALESCE(tp.end_date, vm.measurement_time)
    WHERE tp.phase_type IN ('pre_treatment', 'washout', 'stable_period')
    GROUP BY tp.id, tp.user_id, tp.variable_id
)
SELECT 
    vm.id,
    vm.user_id,
    vm.variable_id,
    bs.reference_phase_id,
    vm.measurement_time,
    bs.reference_value,
    vm.value AS current_value,
    vm.unit_id,
    (vm.value - bs.reference_value) AS absolute_change,
    CASE 
        WHEN bs.reference_value != 0 
        THEN ((vm.value - bs.reference_value) / ABS(bs.reference_value)) * 100 
        ELSE NULL 
    END AS percent_change,
    CASE
        WHEN (vm.value - bs.reference_value) <= -2 * bs.reference_stddev THEN 'much_improved'
        WHEN (vm.value - bs.reference_value) <= -1 * bs.reference_stddev THEN 'improved'
        WHEN (vm.value - bs.reference_value) BETWEEN -1 * bs.reference_stddev AND bs.reference_stddev THEN 'no_change'
        WHEN (vm.value - bs.reference_value) >= 2 * bs.reference_stddev THEN 'much_worsened'
        WHEN (vm.value - bs.reference_value) >= bs.reference_stddev THEN 'worsened'
    END AS severity_change,
    CASE
        WHEN ABS(vm.value - bs.reference_value) >= 2 * bs.reference_stddev THEN true
        ELSE false
    END AS is_clinically_significant,
    NULL::text as notes,
    vm.created_at,
    vm.updated_at
FROM personal.variable_measurements vm
CROSS JOIN LATERAL (
    SELECT * FROM BaselineStats 
    WHERE user_id = vm.user_id AND variable_id = vm.variable_id
    ORDER BY reference_phase_id DESC
    LIMIT 1
) bs;

-- Create view for phase comparisons (replacing table)
CREATE OR REPLACE VIEW personal.n1_trial_phase_comparisons AS
WITH PhaseStats AS (
    SELECT 
        tp.id AS phase_id,
        tp.user_id,
        tp.variable_id,
        tp.start_date,
        tp.end_date,
        AVG(vm.value) AS mean_value,
        STDDEV(vm.value) AS stddev_value,
        COUNT(*) as measurement_count
    FROM personal.n1_trial_phases tp
    JOIN personal.variable_measurements vm ON 
        vm.user_id = tp.user_id AND 
        vm.variable_id = tp.variable_id AND
        vm.measurement_time BETWEEN tp.start_date AND COALESCE(tp.end_date, NOW())
    GROUP BY tp.id, tp.user_id, tp.variable_id, tp.start_date, tp.end_date
)
SELECT 
    gen_random_uuid() as id,  -- Generate UUID for each row
    ref.user_id,
    ref.variable_id,
    tp_ref.id as reference_phase_id,
    tp_comp.id as comparison_phase_id,
    (comp.mean_value - ref.mean_value) as mean_difference,
    CASE 
        WHEN ref.mean_value != 0 
        THEN ((comp.mean_value - ref.mean_value) / ABS(ref.mean_value)) * 100 
        ELSE NULL 
    END as percent_change,
    CASE 
        WHEN ref.stddev_value != 0 
        THEN (comp.mean_value - ref.mean_value) / ref.stddev_value
        ELSE NULL 
    END as z_score,
    CASE 
        WHEN (ref.stddev_value + comp.stddev_value) / 2 != 0 
        THEN (comp.mean_value - ref.mean_value) / ((ref.stddev_value + comp.stddev_value) / 2)
        ELSE NULL 
    END as effect_size,
    CASE
        WHEN ABS(comp.mean_value - ref.mean_value) >= 2 * ref.stddev_value THEN true
        ELSE false
    END as is_clinically_significant,
    jsonb_build_object(
        'reference_measurements', ref.measurement_count,
        'comparison_measurements', comp.measurement_count,
        'reference_period', (ref.end_date - ref.start_date),
        'comparison_period', (comp.end_date - comp.start_date)
    ) as clinical_significance_criteria,
    -- Temporal analysis (calculated when possible)
    CASE 
        WHEN comp.start_date > ref.end_date 
        THEN comp.start_date - ref.end_date
        ELSE NULL 
    END as onset_delay,
    NULL::interval as peak_effect_time, -- Would need more detailed analysis
    CASE 
        WHEN comp.end_date IS NOT NULL 
        THEN comp.end_date - comp.start_date
        ELSE NULL 
    END as duration_of_action,
    now() as analysis_timestamp,
    jsonb_build_object(
        'reference_stats', jsonb_build_object('mean', ref.mean_value, 'stddev', ref.stddev_value),
        'comparison_stats', jsonb_build_object('mean', comp.mean_value, 'stddev', comp.stddev_value)
    ) as analysis_parameters,
    NULL::text as notes,
    now() as created_at,
    now() as updated_at
FROM personal.n1_trial_phases tp_ref
JOIN PhaseStats ref ON ref.phase_id = tp_ref.id
JOIN personal.n1_trial_phases tp_comp ON tp_comp.id = tp_ref.comparison_phase_id
JOIN PhaseStats comp ON comp.phase_id = tp_comp.id
WHERE tp_ref.id != tp_comp.id;

-- Create view for analyzing phase effectiveness
CREATE OR REPLACE VIEW personal.n1_trial_phase_effectiveness AS
WITH PhaseStats AS (
    SELECT 
        tp.id AS phase_id,
        tp.user_id,
        tp.variable_id,
        tp.phase_type,
        tp.intervention_variable_id,
        tp.target_dosage,
        tp.adherence_rate,
        tp.effectiveness_rating,
        AVG(vm.value) as avg_value,
        STDDEV(vm.value) as stddev_value,
        COUNT(*) as measurement_count,
        MIN(vm.measurement_time) as first_measurement,
        MAX(vm.measurement_time) as last_measurement
    FROM personal.n1_trial_phases tp
    JOIN personal.variable_measurements vm ON 
        vm.user_id = tp.user_id 
        AND vm.variable_id = vm.variable_id
        AND vm.measurement_time BETWEEN tp.start_date AND COALESCE(tp.end_date, NOW())
    GROUP BY tp.id, tp.user_id, tp.variable_id, tp.phase_type, 
             tp.intervention_variable_id, tp.target_dosage, 
             tp.adherence_rate, tp.effectiveness_rating
)
SELECT 
    ps.*,
    gv.name as variable_name,
    iv.name as intervention_name,
    CASE 
        WHEN cp.avg_value IS NOT NULL THEN 
            ((ps.avg_value - cp.avg_value) / NULLIF(cp.stddev_value, 0))
        ELSE NULL
    END as effect_size,
    CASE
        WHEN ps.phase_type = 'experimental' THEN
            ps.adherence_rate * ps.effectiveness_rating / 100.0
        ELSE NULL
    END as effectiveness_score
FROM PhaseStats ps
JOIN medical_ref.variables gv ON ps.variable_id = gv.id
LEFT JOIN medical_ref.variables iv ON ps.intervention_variable_id = iv.id
LEFT JOIN PhaseStats cp ON cp.id = (
    SELECT tp2.comparison_phase_id 
    FROM personal.n1_trial_phases tp2 
    WHERE tp2.id = ps.phase_id
);

-- Create view for cost effectiveness analysis
CREATE OR REPLACE VIEW personal.n1_trial_intervention_effectiveness AS
SELECT 
    tp.id as phase_id,
    tp.user_id,
    tp.intervention_variable_id,
    gv.name as intervention_name,
    tp.target_dosage,
    tp.cost_per_unit,
    tp.total_cost,
    tp.effectiveness_rating,
    tp.adherence_rate,
    -- Cost effectiveness metrics
    CASE 
        WHEN tp.effectiveness_rating > 0 THEN
            tp.total_cost / tp.effectiveness_rating
        ELSE NULL
    END as cost_per_effectiveness_point,
    CASE 
        WHEN tp.adherence_rate > 0 THEN
            tp.total_cost / (tp.adherence_rate * tp.effectiveness_rating / 100.0)
        ELSE NULL
    END as adjusted_cost_effectiveness
FROM personal.n1_trial_phases tp
JOIN medical_ref.variables gv ON tp.intervention_variable_id = gv.id
WHERE tp.phase_type = 'experimental'
AND tp.total_cost IS NOT NULL
AND tp.effectiveness_rating IS NOT NULL;

-- Add indexes for better query performance
CREATE INDEX idx_n1_trial_phases_user_var 
    ON personal.n1_trial_phases(user_id, variable_id);
CREATE INDEX idx_n1_trial_phases_intervention 
    ON personal.n1_trial_phases(intervention_variable_id) 
    WHERE phase_type = 'experimental';
CREATE INDEX idx_n1_trial_phases_dates 
    ON personal.n1_trial_phases(start_date, end_date);

-- Add helpful comments
COMMENT ON TABLE personal.n1_trial_phases IS 
    'Tracks phases of N-1 trials including interventions, measurements, and analysis. Supports soft deletion via deleted_at.';
COMMENT ON COLUMN personal.n1_trial_phases.intervention_variable_id IS 
    'Reference to the variable being tested/intervened with during experimental phases';
COMMENT ON COLUMN personal.n1_trial_phases.schedule IS 
    'JSON structure for intervention timing: {"frequency": "daily|weekly|etc", "times": ["08:00", "20:00"], "days": ["Mon", "Wed", "Fri"], "duration_minutes": 30}';
COMMENT ON COLUMN personal.n1_trial_phases.prescription_details IS 
    'JSON structure for prescriptions: {"prescriber": "Dr. Name", "pharmacy": "Name", "rx_number": "123", "refills": 3, "prescribed_date": "2024-03-21"}';
COMMENT ON COLUMN personal.n1_trial_phases.side_effects IS 
    'JSON array of reported side effects: [{"effect": "headache", "severity": 1-5, "onset": "2024-03-21", "notes": "mild"}]';
COMMENT ON COLUMN personal.n1_trial_phases.phase_protocol IS 
    'JSON structure defining complete protocol: {"measurement_schedule": {"frequency": "daily", "times": ["08:00"]}, "conditions": {"activity": "fasting", "time_of_day": "morning"}, "instructions": "text"}';

-- Create view for analyzing severity changes
CREATE OR REPLACE VIEW personal.n1_trial_severity_analysis AS
WITH BaselineMeasurements AS (
    SELECT 
        tp.id AS reference_phase_id,
        tp.user_id,
        tp.variable_id,
        tp.start_date,
        tp.end_date,
        AVG(vm.value) AS reference_avg_value,
        STDDEV(vm.value) AS reference_stddev
    FROM personal.n1_trial_phases tp
    JOIN personal.variable_measurements vm ON 
        tp.user_id = vm.user_id AND 
        tp.variable_id = vm.variable_id AND
        vm.measurement_time BETWEEN tp.start_date AND COALESCE(tp.end_date, vm.measurement_time)
    WHERE tp.phase_type IN ('pre_treatment', 'washout', 'stable_period')
    GROUP BY tp.id, tp.user_id, tp.variable_id, tp.start_date, tp.end_date
),
LatestMeasurements AS (
    SELECT DISTINCT ON (user_id, variable_id)
        user_id,
        variable_id,
        value AS latest_value,
        measurement_time AS latest_measurement_time
    FROM personal.variable_measurements
    ORDER BY user_id, variable_id, measurement_time DESC
)
SELECT 
    bm.user_id,
    bm.variable_id,
    gv.name AS variable_name,
    bm.reference_phase_id,
    bm.reference_avg_value,
    bm.reference_stddev,
    lm.latest_value,
    lm.latest_measurement_time,
    (lm.latest_value - bm.reference_avg_value) AS absolute_change,
    CASE 
        WHEN bm.reference_avg_value != 0 
        THEN ((lm.latest_value - bm.reference_avg_value) / ABS(bm.reference_avg_value)) * 100 
        ELSE NULL 
    END AS percent_change,
    CASE
        WHEN (lm.latest_value - bm.reference_avg_value) <= -2 * bm.reference_stddev THEN 'much_improved'
        WHEN (lm.latest_value - bm.reference_avg_value) <= -1 * bm.reference_stddev THEN 'improved'
        WHEN (lm.latest_value - bm.reference_avg_value) BETWEEN -1 * bm.reference_stddev AND bm.reference_stddev THEN 'no_change'
        WHEN (lm.latest_value - bm.reference_avg_value) >= 2 * bm.reference_stddev THEN 'much_worsened'
        WHEN (lm.latest_value - bm.reference_avg_value) >= bm.reference_stddev THEN 'worsened'
    END AS calculated_severity_change
FROM BaselineMeasurements bm
JOIN medical_ref.variables gv ON bm.variable_id = gv.id
LEFT JOIN LatestMeasurements lm ON bm.user_id = lm.user_id AND bm.variable_id = lm.variable_id;

-- Add RLS policies
ALTER TABLE personal.n1_trial_phases ENABLE ROW LEVEL SECURITY;

-- Users can view their own trial phases
CREATE POLICY "Users can view their own trial phases"
    ON personal.n1_trial_phases FOR SELECT
    USING (auth.uid() = user_id);

-- Users can manage their own trial phases
CREATE POLICY "Users can manage their own trial phases"
    ON personal.n1_trial_phases FOR ALL
    USING (auth.uid() = user_id);

-- Add indexes to support view performance
CREATE INDEX IF NOT EXISTS idx_variable_measurements_user_var_time 
    ON personal.variable_measurements(user_id, variable_id, measurement_time);
CREATE INDEX IF NOT EXISTS idx_variable_measurements_time_range 
    ON personal.variable_measurements(measurement_time);

-- Document views
COMMENT ON VIEW personal.n1_trial_severity_changes IS 
    'Real-time calculation of severity changes for each measurement compared to baseline periods in N-1 trials. Uses standard deviations to determine clinical significance.';
COMMENT ON VIEW personal.n1_trial_phase_comparisons IS 
    'Statistical comparison between N-1 trial phases, including effect sizes, temporal analysis, and clinical significance metrics.';
COMMENT ON VIEW personal.n1_trial_phase_effectiveness IS 
    'Analysis of N-1 trial phase effectiveness combining measurement statistics with adherence and effectiveness ratings.';
COMMENT ON VIEW personal.n1_trial_intervention_effectiveness IS 
    'Cost-benefit analysis for experimental phases in N-1 trials, calculating both raw and adherence-adjusted cost effectiveness.';
COMMENT ON VIEW personal.n1_trial_severity_analysis IS 
    'Longitudinal analysis comparing latest measurements to baseline periods to track N-1 trial progression.';

-- Document key columns
COMMENT ON COLUMN personal.n1_trial_severity_changes.severity_change IS 
    'Categorization based on standard deviations: much_improved (<-2σ), improved (<-1σ), no_change (±1σ), worsened (>1σ), much_worsened (>2σ)';
COMMENT ON COLUMN personal.n1_trial_phase_comparisons.effect_size IS 
    'Cohen''s d calculation using pooled standard deviation between phases';
COMMENT ON COLUMN personal.n1_trial_phase_comparisons.z_score IS 
    'Standardized score using reference phase''s standard deviation';
COMMENT ON COLUMN personal.n1_trial_phase_effectiveness.effectiveness_score IS 
    'Combined score (0-5) factoring in both adherence rate and effectiveness rating';
COMMENT ON COLUMN personal.n1_trial_intervention_effectiveness.adjusted_cost_effectiveness IS 
    'Cost per effectiveness point adjusted for adherence rate to reflect real-world effectiveness'; 

-- Schema: personal, File: personal_schema.sql
-- Personal Schema
-- Contains individual user health data and private records
CREATE SCHEMA personal; 

-- Schema: personal, File: session_transcripts.sql
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

-- Schema: personal, File: upcoming_notifications.sql
-- Upcoming Notifications View
--
-- Shows pending notifications that are scheduled for the near future
-- Useful for notification processing and user dashboards
--
CREATE VIEW personal.upcoming_notifications AS
SELECT 
    n.*,
    CASE 
        WHEN n.type = 'MEDICATION_REMINDER' THEN m.title
        WHEN n.type = 'LAB_RESULT' THEN l.title
        WHEN n.type = 'MEASUREMENT_REMINDER' THEN v.display_name
        ELSE NULL
    END as source_title,
    CASE 
        WHEN n.type = 'MEDICATION_REMINDER' THEN m.notes
        WHEN n.type = 'LAB_RESULT' THEN l.notes
        WHEN n.type = 'MEASUREMENT_REMINDER' THEN v.description
        ELSE NULL
    END as source_details
FROM personal.user_notifications n
LEFT JOIN personal.user_medications m ON n.triggered_by_id = m.id AND n.type = 'MEDICATION_REMINDER'
LEFT JOIN personal.user_lab_results l ON n.triggered_by_id = l.id AND n.type = 'LAB_RESULT'
LEFT JOIN personal.user_variables v ON n.triggered_by_id = v.id AND n.type = 'MEASUREMENT_REMINDER'
WHERE n.status = 'PENDING'
AND n.scheduled_for >= NOW()
AND n.scheduled_for <= NOW() + INTERVAL '7 days'; 

-- Schema: personal, File: user_conditions.sql
-- User Conditions
--
-- User-specific medical conditions and diagnoses
-- Links to standard condition variables in the reference schema
--
CREATE TABLE personal.user_conditions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES core.profiles(id),
    condition_variable_id bigint NOT NULL REFERENCES reference.variables(id),
    onset_at timestamptz NOT NULL,
    resolution_at timestamptz,
    status text NOT NULL CHECK (status IN ('active', 'resolved', 'recurring')),
    severity integer CHECK (severity BETWEEN 1 AND 5),
    notes text,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, condition_variable_id, onset_at)
);

-- Enable RLS
ALTER TABLE personal.user_conditions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own conditions"
    ON personal.user_conditions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own conditions"
    ON personal.user_conditions FOR ALL
    USING (auth.uid() = user_id); 

-- Schema: personal, File: user_documents.sql
-- User Documents
--
-- User-specific medical documents and files
-- Stores metadata about uploaded medical records and documents
--
CREATE TABLE personal.user_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    document_type VARCHAR(50),
    storage_path TEXT NOT NULL,
    mime_type VARCHAR(100),
    file_size INTEGER,
    document_date TIMESTAMP WITH TIME ZONE,
    provider_name TEXT,
    facility_name TEXT,
    tags TEXT[],
    notes TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE personal.user_documents ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own documents"
    ON personal.user_documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own documents"
    ON personal.user_documents FOR ALL
    USING (auth.uid() = user_id); 

-- Schema: personal, File: user_external_treatment_effectiveness_ratings.sql
-- User External Treatment Effectiveness Ratings
--
-- Stores treatment effectiveness ratings imported from external sources
-- These are linked to specific users but may come from third-party data
--
CREATE TABLE personal.user_external_treatment_effectiveness_ratings (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES core.profiles(id),
    treatment_variable_id bigint NOT NULL REFERENCES reference.variables(id),
    condition_variable_id bigint NOT NULL REFERENCES reference.variables(id),
    source_type text NOT NULL CHECK (source_type IN ('doctor', 'research', 'anecdotal')),
    source_name text,
    source_url text,
    effectiveness_rating text CHECK (effectiveness_rating IN ('much_worse', 'worse', 'no_effect', 'better', 'much_better')),
    side_effects_rating text CHECK (side_effects_rating IN ('none', 'mild', 'moderate', 'severe', 'intolerable')),
    confidence_level text CHECK (confidence_level IN ('low', 'medium', 'high')),
    notes text,
    is_public boolean NOT NULL DEFAULT false,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, treatment_variable_id, condition_variable_id, source_type, source_name)
);

-- Enable RLS
ALTER TABLE personal.user_external_treatment_effectiveness_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view public external ratings"
    ON personal.user_external_treatment_effectiveness_ratings FOR SELECT
    USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own external ratings"
    ON personal.user_external_treatment_effectiveness_ratings FOR ALL
    USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_external_ratings_treatment 
    ON personal.user_external_treatment_effectiveness_ratings(treatment_variable_id);
    
CREATE INDEX idx_external_ratings_condition 
    ON personal.user_external_treatment_effectiveness_ratings(condition_variable_id);
    
CREATE INDEX idx_external_ratings_data_source 
    ON personal.user_external_treatment_effectiveness_ratings(source_type);

CREATE INDEX idx_external_ratings_effectiveness 
    ON personal.user_external_treatment_effectiveness_ratings(effectiveness_rating);

CREATE INDEX idx_external_ratings_study_quality 
    ON personal.user_external_treatment_effectiveness_ratings(confidence_level); 

-- Schema: personal, File: user_lab_results.sql
-- User Lab Results
--
-- User-specific laboratory test results
-- Links to standard lab test types in the reference schema
--
CREATE TABLE personal.user_lab_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    lab_test_type_id UUID NOT NULL REFERENCES reference.lab_test_types(id),
    value DECIMAL,
    unit_id UUID REFERENCES reference.units_of_measurement(id),
    status VARCHAR(20),
    specimen_type VARCHAR(50),
    collection_at TIMESTAMP WITH TIME ZONE,
    result_at TIMESTAMP WITH TIME ZONE,
    lab_name TEXT,
    notes TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE personal.user_lab_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own lab results"
    ON personal.user_lab_results FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own lab results"
    ON personal.user_lab_results FOR ALL
    USING (auth.uid() = user_id); 

-- Schema: personal, File: user_notifications.sql
-- User Notifications
--
-- User-specific notifications and reminders
-- Handles various types of medical notifications and alerts
--
CREATE TABLE personal.user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    priority VARCHAR(20) DEFAULT 'NORMAL',
    status VARCHAR(20) DEFAULT 'PENDING',
    scheduled_for TIMESTAMP WITH TIME ZONE,
    triggered_by_table VARCHAR(100),
    triggered_by_id UUID,
    action_type VARCHAR(50),
    action_data JSONB,
    read_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE personal.user_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
    ON personal.user_notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own notifications"
    ON personal.user_notifications FOR ALL
    USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_notifications_user_status 
    ON personal.user_notifications(user_id, status);
    
CREATE INDEX idx_notifications_scheduled 
    ON personal.user_notifications(scheduled_for)
    WHERE status = 'PENDING';

-- Notification Types
CREATE TYPE personal.notification_type AS ENUM (
    'MEDICATION_REMINDER',
    'LAB_RESULT',
    'APPOINTMENT_REMINDER',
    'MEASUREMENT_REMINDER',
    'CONDITION_UPDATE',
    'CORRELATION_FOUND',
    'TREATMENT_SUGGESTION',
    'DATA_IMPORT_COMPLETE',
    'SYSTEM_ALERT'
);

-- Notification Priorities
CREATE TYPE personal.notification_priority AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
);

-- Notification Statuses
CREATE TYPE personal.notification_status AS ENUM (
    'PENDING',
    'SENT',
    'READ',
    'ACTIONED',
    'DISMISSED',
    'FAILED'
);

-- Action Types
CREATE TYPE personal.notification_action_type AS ENUM (
    'VIEW_RECORD',
    'TAKE_MEASUREMENT',
    'CONFIRM_MEDICATION',
    'UPDATE_STATUS',
    'EXTERNAL_LINK',
    'CUSTOM_ACTION'
);

-- Add constraints using the new types
ALTER TABLE personal.user_notifications
    ALTER COLUMN type TYPE personal.notification_type USING type::personal.notification_type,
    ALTER COLUMN priority TYPE personal.notification_priority USING priority::personal.notification_priority,
    ALTER COLUMN status TYPE personal.notification_status USING status::personal.notification_status,
    ALTER COLUMN action_type TYPE personal.notification_action_type USING action_type::personal.notification_action_type;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION personal.mark_notification_read(notification_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE personal.user_notifications
    SET status = 'READ',
        read_at = NOW(),
        updated_at = NOW()
    WHERE id = notification_id
    AND auth.uid() = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to dismiss notification
CREATE OR REPLACE FUNCTION personal.dismiss_notification(notification_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE personal.user_notifications
    SET status = 'DISMISSED',
        updated_at = NOW()
    WHERE id = notification_id
    AND auth.uid() = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new notification
CREATE OR REPLACE FUNCTION personal.create_notification(
    p_user_id UUID,
    p_type personal.notification_type,
    p_title VARCHAR(255),
    p_message TEXT,
    p_priority personal.notification_priority DEFAULT 'NORMAL',
    p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_action_type personal.notification_action_type DEFAULT NULL,
    p_action_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
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

-- Schema: personal, File: user_treatment_effectiveness_ratings.sql
-- User Treatment Effectiveness Ratings
--
-- Stores user-reported effectiveness ratings for treatments
-- These can be aggregated into global treatment effectiveness statistics
--
CREATE TABLE personal.user_treatment_effectiveness_ratings (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES core.profiles(id),
    treatment_variable_id bigint NOT NULL REFERENCES reference.variables(id),
    condition_variable_id bigint NOT NULL REFERENCES reference.variables(id),
    effectiveness_rating text CHECK (effectiveness_rating IN ('much_worse', 'worse', 'no_effect', 'better', 'much_better')),
    side_effects_rating text CHECK (side_effects_rating IN ('none', 'mild', 'moderate', 'severe', 'intolerable')),
    adherence_rating text CHECK (adherence_rating IN ('never', 'rarely', 'sometimes', 'usually', 'always')),
    cost_rating text CHECK (cost_rating IN ('very_expensive', 'expensive', 'moderate', 'affordable', 'very_affordable')),
    notes text,
    is_public boolean NOT NULL DEFAULT false,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, treatment_variable_id, condition_variable_id)
);

-- Enable RLS
ALTER TABLE personal.user_treatment_effectiveness_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view public ratings"
    ON personal.user_treatment_effectiveness_ratings FOR SELECT
    USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own ratings"
    ON personal.user_treatment_effectiveness_ratings FOR ALL
    USING (auth.uid() = user_id); 

-- Schema: personal, File: user_variables.sql
-- User Variables
--
-- User-specific variable settings and preferences
-- Links to global variables but contains user-specific configurations
--
CREATE TABLE personal.user_variables (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES core.profiles(id),
    variable_id bigint NOT NULL REFERENCES reference.variables(id),
    display_name text,
    description text,
    unit_id bigint REFERENCES reference.units_of_measurement(id),
    default_value numeric,
    minimum_value numeric,
    maximum_value numeric,
    filling_type filling_type_enum DEFAULT 'none',
    joining_type combination_operation_enum DEFAULT 'mean',
    onset_delay interval,
    duration_of_action interval,
    measurement_source text,
    measurement_method text,
    last_processed_at timestamptz,
    analysis_settings jsonb,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, variable_id)
);

-- Enable RLS
ALTER TABLE personal.user_variables ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own variables"
    ON personal.user_variables FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own variables"
    ON personal.user_variables FOR ALL
    USING (auth.uid() = user_id); 

-- Schema: personal, File: user_variable_relationships.sql
-- User Variable Relationships
--
-- User-specific relationships between variables
-- Stores individual correlation data and settings
--
CREATE TABLE personal.user_variable_relationships (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES core.profiles(id),
    predictor_variable_id bigint NOT NULL REFERENCES reference.variables(id),
    outcome_variable_id bigint NOT NULL REFERENCES reference.variables(id),
    onset_delay interval, -- Time until predictor shows correlation with outcome
    duration_of_action interval, -- How long predictor correlates with outcome
    correlation_coefficient float,
    confidence_level float CHECK (confidence_level >= 0 AND confidence_level <= 1),
    confidence_score float CHECK (confidence_score >= 0 AND confidence_score <= 1),
    user_vote integer CHECK (user_vote >= -1 AND user_vote <= 1),
    user_notes text,
    status text NOT NULL CHECK (status IN ('active', 'archived', 'deleted')) DEFAULT 'active',
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, predictor_variable_id, outcome_variable_id)
);

-- Index for faster lookups
CREATE INDEX ON personal.user_variable_relationships(user_id);
CREATE INDEX ON personal.user_variable_relationships(predictor_variable_id);
CREATE INDEX ON personal.user_variable_relationships(outcome_variable_id);

-- Enable row level security
ALTER TABLE personal.user_variable_relationships ENABLE ROW LEVEL SECURITY;

-- Policies for different user roles
CREATE POLICY "Users can view own relationships" ON personal.user_variable_relationships
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own relationships" ON personal.user_variable_relationships
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own relationships" ON personal.user_variable_relationships
    FOR UPDATE USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_user_variable_relationships_updated_at
    BEFORE UPDATE ON personal.user_variable_relationships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE personal.user_variable_relationships IS 'Stores user-specific relationships between variables based on personal tracking and analysis';
COMMENT ON COLUMN personal.user_variable_relationships.predictor_variable_id IS 'The variable being tracked as a potential predictor';
COMMENT ON COLUMN personal.user_variable_relationships.outcome_variable_id IS 'The variable being analyzed for potential correlation with the predictor';
COMMENT ON COLUMN personal.user_variable_relationships.onset_delay IS 'Time delay before predictor shows correlation with outcome';
COMMENT ON COLUMN personal.user_variable_relationships.duration_of_action IS 'Duration of correlation between predictor and outcome';
COMMENT ON COLUMN personal.user_variable_relationships.correlation_coefficient IS 'Statistical correlation between predictor and outcome variables';
COMMENT ON COLUMN personal.user_variable_relationships.confidence_level IS 'Statistical confidence level in the correlation';
COMMENT ON COLUMN personal.user_variable_relationships.confidence_score IS 'Overall confidence score considering multiple factors';
COMMENT ON COLUMN personal.user_variable_relationships.user_vote IS 'User feedback on the relationship (-1: disagree, 0: neutral, 1: agree)'; 

-- Schema: personal, File: user_variable_relationship_stats.sql
-- User Variable Relationship Statistics
--
-- Materialized view that calculates statistical relationships between user variables
-- including correlation coefficients, significance tests, and derived metrics.
--
CREATE MATERIALIZED VIEW personal.user_variable_relationship_stats AS
WITH measurement_stats AS (
    SELECT 
        r.id AS relationship_id,
        r.predictor_variable_id,
        r.outcome_variable_id,
        COUNT(DISTINCT DATE_TRUNC('day', pm.timestamp)) as number_of_days,
        COUNT(DISTINCT pm.id) as number_of_predictor_measurements,
        COUNT(DISTINCT om.id) as number_of_outcome_measurements,
        COUNT(DISTINCT CASE WHEN pm.value > p.average_value THEN DATE_TRUNC('day', pm.timestamp) END) as high_predictor_days,
        COUNT(DISTINCT CASE WHEN pm.value <= p.average_value THEN DATE_TRUNC('day', pm.timestamp) END) as low_predictor_days,
        AVG(CASE WHEN pm.value > p.average_value THEN om.value END) as average_outcome_with_high_predictor,
        AVG(CASE WHEN pm.value <= p.average_value THEN om.value END) as average_outcome_with_low_predictor,
        STDDEV(om.value) as outcome_standard_deviation,
        MIN(pm.timestamp) as earliest_measurement_start_at,
        MAX(pm.timestamp) as latest_measurement_start_at
    FROM personal.user_variable_relationships r
    JOIN personal.measurements pm ON pm.variable_id = r.predictor_variable_id
    JOIN personal.measurements om ON om.variable_id = r.outcome_variable_id
        AND om.timestamp >= pm.timestamp + r.onset_delay
        AND om.timestamp <= pm.timestamp + r.onset_delay + r.duration_of_action
    JOIN personal.user_variables p ON p.variable_id = r.predictor_variable_id
    GROUP BY r.id, r.predictor_variable_id, r.outcome_variable_id
)
SELECT 
    relationship_id,
    predictor_variable_id,
    outcome_variable_id,
    number_of_days,
    number_of_predictor_measurements,
    number_of_outcome_measurements,
    high_predictor_days,
    low_predictor_days,
    average_outcome_with_high_predictor,
    average_outcome_with_low_predictor,
    outcome_standard_deviation,
    earliest_measurement_start_at,
    latest_measurement_start_at,
    -- Calculate statistical significance
    CASE 
        WHEN outcome_standard_deviation = 0 THEN 0
        ELSE (average_outcome_with_high_predictor - average_outcome_with_low_predictor) 
             / (outcome_standard_deviation / SQRT(LEAST(high_predictor_days, low_predictor_days)))
    END as t_statistic,
    -- Calculate correlation strength
    CASE 
        WHEN high_predictor_days + low_predictor_days = 0 THEN 0
        ELSE (average_outcome_with_high_predictor - average_outcome_with_low_predictor) 
             / NULLIF(outcome_standard_deviation, 0)
    END as correlation_strength
FROM measurement_stats;

-- Create indexes for faster querying
CREATE UNIQUE INDEX ON personal.user_variable_relationship_stats(relationship_id);
CREATE INDEX ON personal.user_variable_relationship_stats(predictor_variable_id);
CREATE INDEX ON personal.user_variable_relationship_stats(outcome_variable_id);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION personal.refresh_user_variable_relationship_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY personal.user_variable_relationship_stats;
END;
$$ LANGUAGE plpgsql;

-- Trigger to refresh stats when measurements are updated
CREATE OR REPLACE FUNCTION personal.trigger_refresh_relationship_stats()
RETURNS trigger AS $$
BEGIN
    PERFORM personal.refresh_user_variable_relationship_stats();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_relationship_stats_on_measurement_change
AFTER INSERT OR UPDATE OR DELETE ON personal.measurements
FOR EACH STATEMENT
EXECUTE FUNCTION personal.trigger_refresh_relationship_stats();

COMMENT ON MATERIALIZED VIEW personal.user_variable_relationship_stats IS 'Statistical analysis of relationships between user variables based on measurements';
COMMENT ON COLUMN personal.user_variable_relationship_stats.predictor_variable_id IS 'The variable being analyzed as a potential predictor';
COMMENT ON COLUMN personal.user_variable_relationship_stats.outcome_variable_id IS 'The variable being analyzed for potential correlation with the predictor';
COMMENT ON COLUMN personal.user_variable_relationship_stats.number_of_days IS 'Number of days with measurements for both variables';
COMMENT ON COLUMN personal.user_variable_relationship_stats.average_outcome_with_high_predictor IS 'Average outcome value when predictor is above average';
COMMENT ON COLUMN personal.user_variable_relationship_stats.average_outcome_with_low_predictor IS 'Average outcome value when predictor is below average';
COMMENT ON COLUMN personal.user_variable_relationship_stats.t_statistic IS 'T-statistic for the difference in outcome means between high and low predictor values';
COMMENT ON COLUMN personal.user_variable_relationship_stats.correlation_strength IS 'Standardized effect size (Cohen''s d) of predictor on outcome'; 

-- Schema: personal, File: user_variable_stats.sql
-- User Variable Statistics View
--
-- Materialized view that calculates statistics for each user's variables
-- based on their measurements and variable settings
--
CREATE MATERIALIZED VIEW personal.user_variable_stats AS
WITH measurement_stats AS (
    SELECT 
        m.user_id,
        m.variable_id,
        COUNT(*) as number_of_measurements,
        MIN(m.value) as minimum_value,
        MAX(m.value) as maximum_value,
        AVG(m.value) as average_value,
        STDDEV(m.value) as standard_deviation,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY m.value) as percentile_25,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY m.value) as percentile_50,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY m.value) as percentile_75,
        MIN(m.timestamp) as earliest_measurement,
        MAX(m.timestamp) as latest_measurement,
        NOW() - MAX(m.timestamp) as time_since_last_measurement,
        COUNT(DISTINCT DATE_TRUNC('day', m.timestamp)) as number_of_days_with_measurements
    FROM personal.measurements m
    WHERE m.deleted_at IS NULL
    GROUP BY m.user_id, m.variable_id
),
variable_settings AS (
    SELECT 
        uv.user_id,
        uv.variable_id,
        uv.display_name,
        uv.description,
        uv.unit_id,
        uv.default_value,
        uv.minimum_value as user_minimum_value,
        uv.maximum_value as user_maximum_value,
        uv.filling_type,
        uv.joining_type,
        uv.onset_delay,
        uv.duration_of_action,
        uv.analysis_settings
    FROM personal.user_variables uv
    WHERE uv.deleted_at IS NULL
)
SELECT 
    vs.user_id,
    vs.variable_id,
    gv.name as variable_name,
    COALESCE(vs.display_name, gv.display_name) as display_name,
    COALESCE(vs.description, gv.description) as description,
    COALESCE(vs.unit_id, gv.unit_id) as unit_id,
    gv.data_type,
    COALESCE(vs.default_value, gv.default_value) as default_value,
    COALESCE(vs.user_minimum_value, gv.minimum_value) as minimum_allowed_value,
    COALESCE(vs.user_maximum_value, gv.maximum_value) as maximum_allowed_value,
    ms.number_of_measurements,
    ms.minimum_value as minimum_recorded_value,
    ms.maximum_value as maximum_recorded_value,
    ms.average_value,
    ms.standard_deviation,
    ms.percentile_25,
    ms.percentile_50,
    ms.percentile_75,
    ms.earliest_measurement,
    ms.latest_measurement,
    ms.time_since_last_measurement,
    ms.number_of_days_with_measurements,
    COALESCE(vs.filling_type, 'none') as filling_type,
    COALESCE(vs.joining_type, 'none') as joining_type,
    COALESCE(vs.onset_delay, '0'::interval) as onset_delay,
    COALESCE(vs.duration_of_action, '0'::interval) as duration_of_action,
    vs.analysis_settings,
    NOW() as last_updated
FROM variable_settings vs
JOIN reference.variables gv ON vs.variable_id = gv.id
LEFT JOIN measurement_stats ms ON vs.user_id = ms.user_id AND vs.variable_id = ms.variable_id;

-- Create indexes for better query performance
CREATE UNIQUE INDEX idx_user_variable_stats_user_variable
ON personal.user_variable_stats(user_id, variable_id);

CREATE INDEX idx_user_variable_stats_variable
ON personal.user_variable_stats(variable_id);

-- Add comments
COMMENT ON MATERIALIZED VIEW personal.user_variable_stats IS 
'User-specific variable statistics calculated from measurements and variable settings';

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION personal.refresh_user_variable_stats()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY personal.user_variable_stats;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh the view when measurements or settings change
CREATE TRIGGER refresh_user_variable_stats_measurements
AFTER INSERT OR UPDATE OR DELETE ON personal.measurements
FOR EACH STATEMENT EXECUTE FUNCTION personal.refresh_user_variable_stats();

CREATE TRIGGER refresh_user_variable_stats_variables
AFTER INSERT OR UPDATE OR DELETE ON personal.user_variables
FOR EACH STATEMENT EXECUTE FUNCTION personal.refresh_user_variable_stats(); 

-- Schema: personal, File: variable_relationships.sql
-- Variable Relationships
--
-- Tracks relationships between variables for each user, including correlations,
-- predictive relationships, and causal inferences
--
CREATE TABLE personal.variable_relationships (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES core.profiles(id),
    cause_variable_id INTEGER NOT NULL REFERENCES reference.variables(id),
    effect_variable_id INTEGER NOT NULL REFERENCES reference.variables(id),
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('correlation', 'prediction', 'causation')),
    relationship_strength DOUBLE PRECISION,
    confidence_level DOUBLE PRECISION,
    lag_in_seconds INTEGER,
    onset_delay INTERVAL,
    duration_of_action INTERVAL,
    number_of_pairs INTEGER,
    p_value DOUBLE PRECISION,
    t_value DOUBLE PRECISION,
    critical_t_value DOUBLE PRECISION,
    confidence_interval_min DOUBLE PRECISION,
    confidence_interval_max DOUBLE PRECISION,
    statistical_significance BOOLEAN,
    cause_changes DOUBLE PRECISION,
    effect_changes DOUBLE PRECISION,
    qm_score DOUBLE PRECISION COMMENT 'Quality of data and relationship (0-100)',
    predictor_error DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'completed', 'failed')),
    error_message TEXT,
    analysis_parameters JSONB,
    analysis_version TEXT,
    UNIQUE(user_id, cause_variable_id, effect_variable_id)
);

-- Create indexes
CREATE INDEX idx_variable_relationships_user ON personal.variable_relationships(user_id);
CREATE INDEX idx_variable_relationships_cause ON personal.variable_relationships(cause_variable_id);
CREATE INDEX idx_variable_relationships_effect ON personal.variable_relationships(effect_variable_id);
CREATE INDEX idx_variable_relationships_strength ON personal.variable_relationships(relationship_strength DESC);
CREATE INDEX idx_variable_relationships_qm_score ON personal.variable_relationships(qm_score DESC);

-- Enable RLS
ALTER TABLE personal.variable_relationships ENABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE personal.variable_relationships IS 'Tracks relationships between variables for each user, including correlations, predictions, and causal inferences';

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON personal.variable_relationships
    FOR EACH ROW
    EXECUTE FUNCTION common.set_updated_at(); 

-- Schema: reference, File: data_quality_rules.sql
-- Data Quality Rules
--
-- Rules for validating and ensuring data quality
-- Applied to measurements and other user-submitted data
--
CREATE TABLE reference.data_quality_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    rule_type VARCHAR(50) NOT NULL,
    validation_function TEXT,
    error_message TEXT,
    severity VARCHAR(20) DEFAULT 'ERROR',
    applies_to_table VARCHAR(100),
    applies_to_column VARCHAR(100),
    parameters JSONB,
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default rules
INSERT INTO reference.data_quality_rules 
(name, description, rule_type, validation_function, error_message, severity, applies_to_table, applies_to_column) 
VALUES 
('FUTURE_DATE_CHECK', 
 'Ensures dates are not in the future', 
 'DATE_VALIDATION',
 'date <= CURRENT_DATE',
 'Date cannot be in the future',
 'ERROR',
 NULL,
 NULL),

('NEGATIVE_VALUE_CHECK',
 'Ensures numeric values are not negative when inappropriate',
 'NUMERIC_VALIDATION',
 'value >= 0',
 'Value cannot be negative',
 'ERROR',
 NULL,
 NULL),

('OUTLIER_CHECK',
 'Flags statistical outliers for review',
 'STATISTICAL_VALIDATION',
 'ABS((value - avg) / stddev) <= 3',
 'Value is a statistical outlier',
 'WARNING',
 NULL,
 NULL),

('MISSING_REQUIRED_CHECK',
 'Ensures required fields are not null',
 'NULL_VALIDATION',
 'value IS NOT NULL',
 'Required field cannot be null',
 'ERROR',
 NULL,
 NULL),

('DUPLICATE_CHECK',
 'Identifies potential duplicate entries',
 'DUPLICATE_VALIDATION',
 'COUNT(*) = 1',
 'Potential duplicate entry detected',
 'WARNING',
 NULL,
 NULL); 

-- Schema: reference, File: data_sources.sql
-- Add data sources table
CREATE TABLE IF NOT EXISTS reference.data_sources (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type text NOT NULL CHECK (source_type IN (
        'data_import',      -- File uploads and documents
        'oauth_client',     -- OAuth2 client applications
        'integration',      -- Third-party API integrations
        'manual_entry',     -- Direct user input
        'device',          -- Connected devices/sensors
        'calculated'       -- Derived/calculated from other measurements
    )),
    -- Source-specific identifiers (only one should be set based on source_type)
    import_id uuid REFERENCES personal.data_imports(id) ON DELETE SET NULL,
    client_id uuid REFERENCES oauth2.clients(id) ON DELETE SET NULL,
    integration_id text, -- External integration identifier
    device_id text,     -- Device identifier
    -- Common metadata
    name text NOT NULL,  -- Display name of the source
    description text,    -- Optional description
    metadata jsonb,      -- Additional source-specific metadata
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    -- Ensure only one identifier is set based on source_type
    CONSTRAINT valid_source_reference CHECK (
        CASE source_type
            WHEN 'data_import' THEN (import_id IS NOT NULL AND client_id IS NULL AND integration_id IS NULL AND device_id IS NULL)
            WHEN 'oauth_client' THEN (import_id IS NULL AND client_id IS NOT NULL AND integration_id IS NULL AND device_id IS NULL)
            WHEN 'integration' THEN (import_id IS NULL AND client_id IS NULL AND integration_id IS NOT NULL AND device_id IS NULL)
            WHEN 'device' THEN (import_id IS NULL AND client_id IS NULL AND integration_id IS NULL AND device_id IS NOT NULL)
            ELSE (import_id IS NULL AND client_id IS NULL AND integration_id IS NULL AND device_id IS NULL)
        END
    )
);

-- Add indexes for data sources
CREATE INDEX idx_data_sources_source_type ON reference.data_sources(source_type);
CREATE INDEX idx_data_sources_import_id ON reference.data_sources(import_id) WHERE import_id IS NOT NULL;
CREATE INDEX idx_data_sources_client_id ON reference.data_sources(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_data_sources_integration_id ON reference.data_sources(integration_id) WHERE integration_id IS NOT NULL;
CREATE INDEX idx_data_sources_device_id ON reference.data_sources(device_id) WHERE device_id IS NOT NULL;

-- Add comment explaining the data sources system
COMMENT ON TABLE reference.data_sources IS 
'Centralized registry of all data sources that can contribute measurements to the system. 
This includes file imports, OAuth clients, third-party integrations, devices, and manual entry.
Each source type has its own identifier pattern and metadata structure.'; 

-- Schema: reference, File: lab_test_types.sql
-- Lab Test Types
--
-- Standard laboratory test definitions and reference ranges
-- Used to validate and interpret lab results
--
CREATE TABLE reference.lab_test_types (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL UNIQUE,
    display_name text NOT NULL,
    description text,
    variable_id bigint REFERENCES reference.variables(id),
    loinc_code text UNIQUE,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed common lab test types
INSERT INTO reference.lab_test_types (name, display_name, description) VALUES
('blood_glucose', 'Blood Glucose', 'Blood glucose level measurement'),
('hemoglobin_a1c', 'Hemoglobin A1C', 'Hemoglobin A1C percentage measurement'),
('total_cholesterol', 'Total Cholesterol', 'Total cholesterol level measurement'),
('hdl_cholesterol', 'HDL Cholesterol', 'HDL cholesterol level measurement'),
('ldl_cholesterol', 'LDL Cholesterol', 'LDL cholesterol level measurement'),
('triglycerides', 'Triglycerides', 'Triglycerides level measurement'),
('blood_pressure_systolic', 'Systolic Blood Pressure', 'Systolic blood pressure measurement'),
('blood_pressure_diastolic', 'Diastolic Blood Pressure', 'Diastolic blood pressure measurement'),
('heart_rate', 'Heart Rate', 'Heart rate measurement'),
('body_temperature', 'Body Temperature', 'Body temperature measurement'); 

-- Schema: reference, File: population_segments.sql
-- Population segments table for defining cohorts and demographic groups
CREATE TABLE reference.population_segments (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL UNIQUE,
    display_name text NOT NULL,
    description text,
    age_min numeric,
    age_max numeric,
    condition_variable_id bigint REFERENCES reference.global_variables(id),
    demographic_filters jsonb,
    metadata jsonb,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable row level security
ALTER TABLE reference.population_segments ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON reference.population_segments
    FOR SELECT USING (true);

COMMENT ON TABLE reference.population_segments IS 'Defines population segments for modeling (e.g., age groups, conditions, demographics)';
COMMENT ON COLUMN reference.population_segments.condition_variable_id IS 'Reference to condition/disease variable if segment is condition-specific';
COMMENT ON COLUMN reference.population_segments.demographic_filters IS 'JSON filters for demographic criteria';
COMMENT ON COLUMN reference.population_segments.metadata IS 'Additional segment metadata and criteria'; 

-- Schema: reference, File: reference_schema.sql
-- Reference Schema
-- Contains static medical reference data, standards, and definitions
CREATE SCHEMA reference; 

-- Schema: reference, File: units_of_measurement.sql
-- Units of Measurement
--
-- Standard units for measuring health variables
-- Includes conversion factors, display information, and metadata
--

CREATE TABLE reference.units_of_measurement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(255),
    name VARCHAR(100) NOT NULL UNIQUE,
    descriptive_name VARCHAR(255),
    abbreviation VARCHAR(20),
    code_system VARCHAR(255),
    definition TEXT,
    synonym VARCHAR(255),
    status VARCHAR(50),
    kind_of_quantity VARCHAR(255),
    concept_id VARCHAR(255),
    dimension VARCHAR(255),
    unit_category_id SMALLINT REFERENCES reference.unit_categories(id),
    minimum_value DECIMAL,
    maximum_value DECIMAL,
    maximum_daily_value DECIMAL,
    conversion_steps JSONB,
    filling_type filling_type_enum NOT NULL DEFAULT 'none',
    filling_value DECIMAL,
    scale scale_type_enum NOT NULL DEFAULT 'ratio',
    advanced BOOLEAN NOT NULL DEFAULT false,
    manual_tracking BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    slug VARCHAR(200) UNIQUE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for commonly queried fields
CREATE INDEX idx_units_category ON reference.units_of_measurement(unit_category_id);
CREATE INDEX idx_units_code ON reference.units_of_measurement(code);
CREATE INDEX idx_units_status ON reference.units_of_measurement(status);

-- Add table comments
COMMENT ON TABLE reference.units_of_measurement IS 'Standard units for measuring health variables including conversion factors and metadata';
COMMENT ON COLUMN reference.units_of_measurement.filling_type IS 'Specifies how periods of missing data should be treated';
COMMENT ON COLUMN reference.units_of_measurement.scale IS 'Measurement scale type: nominal (categorical), ordinal (ordered), interval (equal intervals), or ratio (true zero)';
COMMENT ON COLUMN reference.units_of_measurement.advanced IS 'Advanced units are rarely used and should be hidden or at bottom of selector lists';
COMMENT ON COLUMN reference.units_of_measurement.manual_tracking IS 'Include in selector when manually recording measurements';
COMMENT ON COLUMN reference.units_of_measurement.maximum_daily_value IS 'Maximum aggregated measurement value over a single day';

-- Seed data for standard units
INSERT INTO reference.units_of_measurement (
    name, abbreviation, unit_category_id, minimum_value, maximum_value, 
    filling_type, scale, advanced, manual_tracking, conversion_steps, maximum_daily_value
) VALUES
-- Duration units
('Seconds', 's', 1, 0, NULL, 'zero', 'ratio', true, false, '[]', 86400),
('Minutes', 'min', 1, 0, 10080, 'zero', 'ratio', false, true, '[{"operation":"MULTIPLY","value":60}]', 1440),
('Hours', 'h', 1, 0, NULL, 'zero', 'ratio', false, true, '[{"operation":"MULTIPLY","value":3600}]', 24),
('Milliseconds', 'ms', 1, 0, 864000000, 'zero', 'ratio', true, false, '[{"operation":"MULTIPLY","value":0.001}]', 86400000),
('Days', 'd', 1, 0, NULL, 'zero', 'ratio', false, true, '[{"operation":"MULTIPLY","value":86400}]', 1),
('Weeks', 'wk', 1, 0, NULL, 'zero', 'ratio', false, true, '[{"operation":"MULTIPLY","value":604800}]', 1),
('Months', 'mo', 1, 0, NULL, 'zero', 'ratio', false, true, '[{"operation":"MULTIPLY","value":2592000}]', 1),
('Years', 'a', 1, 0, NULL, 'zero', 'ratio', false, true, '[{"operation":"MULTIPLY","value":31536000}]', 1),

-- Distance units
('Meters', 'm', 2, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),
('Kilometers', 'km', 2, 0, NULL, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":1000}]', NULL),
('Centimeters', 'cm', 2, 0, NULL, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":0.01}]', NULL),
('Millimeters', 'mm', 2, 0, NULL, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":0.001}]', NULL),
('Miles', 'mi', 2, 0, NULL, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":1609.34}]', NULL),
('Inches', 'in', 2, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":0.0254}]', NULL),
('Feet', 'ft', 2, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":0.3048}]', NULL),

-- Area units
('Square Meters', 'm²', 14, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),
('Square Centimeters', 'cm²', 14, 0, NULL, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":0.0001}]', NULL),
('Square Millimeters', 'mm²', 14, 0, NULL, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":0.000001}]', NULL),
('Square Inches', 'in²', 14, 0, NULL, 'none', 'ratio', true, true, '[{"operation":"MULTIPLY","value":0.00064516}]', NULL),

-- Weight units
('Kilograms', 'kg', 3, 0, NULL, 'none', 'ratio', true, true, '[]', NULL),
('Grams', 'g', 3, 0, NULL, 'zero', 'ratio', false, true, '[{"operation":"MULTIPLY","value":0.001}]', NULL),
('Milligrams', 'mg', 3, 0, NULL, 'zero', 'ratio', false, true, '[{"operation":"MULTIPLY","value":1.0e-6}]', 1000000),
('Micrograms', 'mcg', 3, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":1.0e-6}]', 10000),
('Pounds', 'lb', 3, 0, 1000, 'none', 'ratio', true, true, '[{"operation":"MULTIPLY","value":0.453592}]', NULL),
('Ounces', 'oz', 3, 0, NULL, 'none', 'ratio', true, true, '[{"operation":"MULTIPLY","value":0.0283495}]', NULL),
('Metric Tons', 't', 3, 0, NULL, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":1000}]', NULL),
('Nanograms', 'ng', 3, 0, NULL, 'zero', 'ratio', true, false, '[{"operation":"MULTIPLY","value":1.0e-12}]', NULL),

-- Volume units
('Milliliters', 'mL', 4, 0, NULL, 'zero', 'ratio', false, true, '[{"operation":"MULTIPLY","value":0.001}]', 1000000),
('Liters', 'L', 4, 0, NULL, 'zero', 'ratio', true, true, '[]', 10),
('Ounces', 'oz', 4, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":0.0295735}]', NULL),
('Quarts', 'qt', 4, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":0.946353}]', NULL),
('Cubic Meters', 'm³', 4, 0, NULL, 'zero', 'ratio', true, false, '[{"operation":"MULTIPLY","value":1000}]', NULL),
('Cubic Centimeters', 'cm³', 4, 0, NULL, 'zero', 'ratio', true, false, '[{"operation":"MULTIPLY","value":0.001}]', NULL),
('Fluid Ounces', 'fl_oz', 4, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":0.0295735}]', NULL),
('Milliliters per Hour', 'mL/h', 4, 0, NULL, 'zero', 'ratio', true, false, '[{"operation":"MULTIPLY","value":0.001}]', NULL),

-- Rating units
('1 to 5 Rating', '/5', 5, 1, 5, 'none', 'ordinal', false, true, '[{"operation":"MULTIPLY","value":25},{"operation":"ADD","value":-25}]', NULL),
('0 to 1 Rating', '/1', 5, 0, 1, 'none', 'ordinal', true, false, '[{"operation":"MULTIPLY","value":100}]', NULL),
('1 to 10 Rating', '/10', 5, 1, 10, 'none', 'ordinal', false, true, '[{"operation":"MULTIPLY","value":11.111111111111},{"operation":"ADD","value":-11.111111111111}]', NULL),
('-4 to 4 Rating', '-4 to 4', 5, -4, 4, 'none', 'ordinal', true, false, '[{"operation":"ADD","value":4},{"operation":"MULTIPLY","value":12.5}]', NULL),
('0 to 5 Rating', '/6', 5, 0, 5, 'none', 'ordinal', true, false, '[{"operation":"MULTIPLY","value":20}]', NULL),
('1 to 3 Rating', '/3', 5, 1, 3, 'none', 'ordinal', true, true, '[{"operation":"MULTIPLY","value":50},{"operation":"ADD","value":-50}]', NULL),

-- Proportion units
('Percent', '%', 8, NULL, NULL, 'none', 'interval', true, true, '[]', NULL),

-- Miscellany units
('Index', 'index', 6, 0, NULL, 'none', 'ordinal', true, false, '[]', NULL),
('Degrees East', 'degrees east', 6, NULL, NULL, 'none', 'interval', true, false, '[]', NULL),
('Degrees North', 'degrees north', 6, NULL, NULL, 'none', 'interval', true, false, '[]', NULL),
('% Recommended Daily Allowance', '%RDA', 6, 0, NULL, 'none', 'ratio', true, false, '[]', 10000),
('International Units', 'IU', 6, 0, NULL, 'zero', 'ratio', true, true, '[]', NULL),
('Parts per Million', 'ppm', 6, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),
('Decibels', 'dB', 6, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),

-- Energy units
('Kilocalories', 'kcal', 7, NULL, NULL, 'none', 'ratio', true, false, '[]', 20000),
('Calories', 'cal', 7, NULL, NULL, 'none', 'ratio', true, false, '[]', 20000),
('Gigabecquerel', 'GBq', 7, NULL, NULL, 'none', 'interval', true, true, '[]', NULL),

-- Frequency/Rate units
('per Minute', '/minute', 9, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),
('Meters per Second', 'm/s', 9, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),
('Beats per Minute', 'bpm', 9, 20, 300, 'none', 'ratio', true, false, '[]', NULL),
('Miles per Hour', 'mph', 9, 0, NULL, 'none', 'ratio', true, true, '[]', NULL),
('per Second', '/s', 9, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),
('per Hour', '/h', 9, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),
('Kilometers per Hour', 'km/h', 9, 0, NULL, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":0.277778}]', NULL),

-- Pressure units
('Millimeters Merc', 'mmHg', 10, 1, 100000, 'none', 'ratio', true, true, '[{"operation":"MULTIPLY","value":133.32239}]', NULL),
('Pascal', 'Pa', 10, 10132, 1113250, 'none', 'ratio', true, false, '[]', NULL),
('Torr', 'torr', 10, 76, 7600, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":133.322}]', NULL),
('Millibar', 'mbar', 10, 101, 10130, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":133.32239}]', NULL),
('Hectopascal', 'hPa', 10, 101.32, 11132.5, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":100}]', NULL),
('Kilopascals', 'kPa', 10, 0, NULL, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":1000}]', NULL),
('Atmospheres', 'atm', 10, 0, NULL, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":101325}]', NULL),

-- Temperature units
('Degrees Fahrenheit', 'F', 11, -87, 214, 'none', 'interval', true, true, '[{"operation":"ADD","value":-32},{"operation":"MULTIPLY","value":0.55555555555556}]', NULL),
('Degrees Celsius', 'C', 11, -66, 101, 'none', 'interval', true, true, '[]', NULL),

-- Currency units
('Dollars', '$', 12, NULL, NULL, 'zero', 'ratio', true, false, '[]', NULL),

-- Concentration units
('Moles per Liter', 'mol/L', 15, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),
('Millimoles per Liter', 'mmol/L', 15, 0, NULL, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":0.001}]', NULL),
('Units per Liter', 'U/L', 15, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),
('Milligrams per Milliliter', 'mg/mL', 15, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),
('Nanograms per Milliliter', 'ng/mL', 15, 0, NULL, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":1e-6}]', NULL),
('Millimoles per Kilogram', 'mmol/kg', 15, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),
('Milligrams per Deciliter', 'mg/dL', 15, 0, NULL, 'none', 'ratio', true, true, '[{"operation":"MULTIPLY","value":0.01}]', NULL),
('Micrograms per Milliliter', 'μg/mL', 15, 0, NULL, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":0.001}]', NULL),
('Grams per Liter', 'g/L', 15, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),
('Moles per Cubic Meter', 'mol/m³', 15, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),

-- Count units
('Tablets', 'tablets', 13, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":1}]', 20),
('Units', 'units', 13, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":1}]', NULL),
('Puffs', 'puffs', 13, 0, 100, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":1}]', NULL),
('Applications', 'applications', 13, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":1}]', 20),
('Yes/No', 'yes/no', 13, 0, 1, 'zero', 'ordinal', false, true, '[{"operation":"MULTIPLY","value":1}]', NULL),
('Count', 'count', 13, 0, NULL, 'zero', 'ratio', false, true, '[{"operation":"MULTIPLY","value":1}]', NULL),
('Pills', 'pills', 13, 0, 20, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":1}]', 100),
('Capsules', 'capsules', 13, 0, 1000, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":1}]', 20),
('Pieces', 'pieces', 13, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":1}]', 100),
('Event', 'event', 13, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":1}]', NULL),
('Serving', 'serving', 13, 0, NULL, 'zero', 'ratio', false, true, '[{"operation":"MULTIPLY","value":1}]', 40),
('Sprays', 'sprays', 13, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":1}]', 50),
('Drops', 'drops', 13, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":1}]', 100),
('Doses', 'dose', 13, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":1}]', NULL); 

-- Schema: reference, File: unit_categories.sql
-- Unit Categories
--
-- Categories for units of measurement with metadata about aggregation capabilities
--

CREATE TABLE reference.unit_categories (
    id SMALLINT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    can_be_summed BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add table comments
COMMENT ON TABLE reference.unit_categories IS 'Categories for units of measurement with metadata about aggregation capabilities';
COMMENT ON COLUMN reference.unit_categories.can_be_summed IS 'Whether measurements in this category can be meaningfully summed';
COMMENT ON COLUMN reference.unit_categories.sort_order IS 'Display order for the category in lists and selectors';

-- Create indexes
CREATE INDEX idx_unit_categories_name ON reference.unit_categories(name);

-- Seed data for unit categories
INSERT INTO reference.unit_categories (
    id, name, can_be_summed, sort_order, created_at, updated_at
) VALUES
    (1, 'Duration', true, 0, '2020-08-12 02:38:02', '2020-08-12 02:38:02'),
    (2, 'Distance', true, 0, '2020-08-12 02:38:02', '2020-08-12 02:38:02'),
    (3, 'Weight', true, 0, '2020-08-12 02:38:02', '2020-08-12 02:38:02'),
    (4, 'Volume', true, 0, '2020-08-12 02:38:02', '2020-08-12 02:38:02'),
    (5, 'Rating', false, 0, '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    (6, 'Miscellany', true, 0, '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    (7, 'Energy', true, 0, '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    (8, 'Proportion', false, 0, '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    (9, 'Frequency', false, 0, '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    (10, 'Pressure', false, 0, '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    (11, 'Temperature', false, 0, '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    (12, 'Currency', true, 0, '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    (13, 'Count', true, 0, '2020-08-12 02:38:03', '2020-08-12 02:38:03');

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON reference.unit_categories
    FOR EACH ROW
    EXECUTE FUNCTION common.set_updated_at(); 

-- Schema: reference, File: variables.sql
-- Variables
--
-- Variable overviews with statistics, analysis settings, and data visualizations
-- and likely outcomes or predictors based on the anonymously aggregated donated data.
--

CREATE TABLE reference.variables (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(125) NOT NULL UNIQUE COMMENT 'User-defined variable display name',
    number_of_user_variables INTEGER DEFAULT 0 NOT NULL COMMENT 'Number of variables',
    variable_category_id INTEGER NOT NULL REFERENCES reference.variable_categories(id),
    default_unit_id INTEGER NOT NULL REFERENCES reference.units_of_measurement(id),
    default_value DOUBLE PRECISION,
    cause_only BOOLEAN COMMENT 'A value of true indicates that this variable is generally a cause in a causal relationship. An example would be Cloud Cover which would generally not be influenced by user behavior',
    client_id VARCHAR(80),
    combination_operation combination_operation_enum DEFAULT 'mean' COMMENT 'How to combine values of this variable (for instance, to see a summary of the values over a month)',
    common_alias VARCHAR(125),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    description TEXT,
    duration_of_action INTEGER COMMENT 'How long the effect of a measurement in this variable lasts',
    filling_value DOUBLE PRECISION DEFAULT -1 COMMENT 'Value for replacing null measurements',
    image_url VARCHAR(2083),
    informational_url VARCHAR(2083),
    ion_icon VARCHAR(40),
    maximum_allowed_value DOUBLE PRECISION COMMENT 'Maximum reasonable value for a single measurement for this variable in the default unit',
    minimum_allowed_value DOUBLE PRECISION COMMENT 'Minimum reasonable value for this variable (uses default unit)',
    most_common_original_unit_id INTEGER COMMENT 'Most common Unit ID',
    onset_delay INTEGER COMMENT 'How long it takes for a measurement in this variable to take effect',
    outcome BOOLEAN COMMENT 'Outcome variables are those for which a human would generally want to identify influencing factors. These include symptoms, physique, mood, cognitive performance, etc.',
    parent_id INTEGER REFERENCES reference.variables(id) COMMENT 'ID of the parent variable if this variable has any parent',
    price DOUBLE PRECISION COMMENT 'Price',
    product_url VARCHAR(2083) COMMENT 'Product URL',
    status VARCHAR(25) DEFAULT 'WAITING' NOT NULL COMMENT 'status',
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    most_common_connector_id INTEGER,
    synonyms VARCHAR(600) COMMENT 'The primary variable name and any synonyms for it. This field should be used for non-specific variable searches.',
    wikipedia_url VARCHAR(2083),
    brand_name VARCHAR(125),
    valence valence_type_enum DEFAULT 'neutral',
    wikipedia_title VARCHAR(100),
    upc_12 VARCHAR(255),
    upc_14 VARCHAR(255),
    deleted_at TIMESTAMPTZ,
    most_common_source_name VARCHAR(255),
    data_sources_count TEXT COMMENT 'Array of connector or client measurement data source names as key with number of users as value',
    optimal_value_message VARCHAR(500),
    best_cause_variable_id INTEGER REFERENCES reference.variables(id),
    best_effect_variable_id INTEGER REFERENCES reference.variables(id),
    common_maximum_allowed_daily_value DOUBLE PRECISION,
    common_minimum_allowed_daily_value DOUBLE PRECISION,
    common_minimum_allowed_non_zero_value DOUBLE PRECISION,
    minimum_allowed_seconds_between_measurements INTEGER,
    additional_meta_data TEXT,
    manual_tracking BOOLEAN,
    wp_post_id BIGINT,
    charts JSONB,
    creator_user_id UUID NOT NULL REFERENCES core.profiles(id),
    best_aggregate_correlation_id INTEGER,
    filling_type filling_type_enum DEFAULT 'none',
    deletion_reason VARCHAR(280) COMMENT 'The reason the variable was deleted',
    maximum_allowed_daily_value DOUBLE PRECISION COMMENT 'The maximum allowed value in the default unit for measurements aggregated over a single day',
    is_public BOOLEAN,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_goal frequency_type_enum DEFAULT 'never' COMMENT 'The effect of a food on symptom severity is useful because you can control the predictor directly. However, the effect of a symptom on foods eaten is not very useful',
    controllable frequency_type_enum DEFAULT 'never' COMMENT 'You can control foods eaten directly. However, symptom severity or weather is not directly controllable',
    boring BOOLEAN COMMENT 'The variable is boring if the average person would not be interested in its causes or effects',
    slug VARCHAR(200) UNIQUE COMMENT 'The slug is the part of a URL that identifies a page in human-readable keywords',
    canonical_variable_id INTEGER REFERENCES reference.variables(id) COMMENT 'If a variable duplicates another but with a different name, set the canonical variable id to match the variable with the more appropriate name',
    predictor BOOLEAN COMMENT 'predictor is true if the variable is a factor that could influence an outcome of interest',
    source_url VARCHAR(2083) COMMENT 'URL for the website related to the database containing the info that was used to create this variable',
    string_id VARCHAR(125)
);

-- Create indexes
CREATE INDEX idx_variables_category_unit ON reference.variables (variable_category_id, default_unit_id, name, number_of_user_variables, id);
CREATE INDEX idx_variables_default_unit ON reference.variables (default_unit_id);
CREATE INDEX idx_variables_deleted_synonyms ON reference.variables (deleted_at, synonyms, number_of_user_variables);
CREATE INDEX idx_variables_analysis_ended ON reference.variables (analysis_ended_at);
CREATE INDEX idx_variables_name_users ON reference.variables (name, number_of_user_variables);

-- Enable RLS
ALTER TABLE reference.variables ENABLE ROW LEVEL SECURITY;

-- Add table comments
COMMENT ON TABLE reference.variables IS 'Variable overviews with statistics, analysis settings, and data visualizations and likely outcomes or predictors based on the anonymously aggregated donated data.';

-- Schema: reference, File: variable_categories.sql
-- Variable Categories
--
-- Standard categories for classifying medical variables
-- These categories help organize and group different types of health measurements
--

CREATE TABLE reference.variable_categories (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    name_singular VARCHAR(100),
    description TEXT,
    synonyms JSONB,  -- Changed from TEXT to JSONB
    slug VARCHAR(200) GENERATED ALWAYS AS (
        LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
    ) STORED,
    
    -- UI/Display
    sort_order INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    boring BOOLEAN DEFAULT false,
    
    -- Measurement constraints
    default_unit_id UUID REFERENCES reference.units_of_measurement(id) ON DELETE SET NULL,
    minimum_allowed_value DOUBLE PRECISION,
    maximum_allowed_value DOUBLE PRECISION,
    minimum_allowed_seconds_between_measurements INTEGER,
    filling_value DOUBLE PRECISION DEFAULT -1,
    filling_type filling_type_enum DEFAULT 'none',  -- Using existing enum
    
    -- Variable behavior
    duration_of_action INTEGER DEFAULT 86400,
    onset_delay INTEGER DEFAULT 0,
    combination_operation combination_operation_enum DEFAULT 'mean',
    
    -- Tracking settings
    manual_tracking BOOLEAN DEFAULT false,
    valence valence_type_enum DEFAULT 'neutral',
    is_goal frequency_type_enum DEFAULT 'never',
    controllable frequency_type_enum DEFAULT 'never',
    
    -- Relationship flags
    cause_only BOOLEAN DEFAULT false,
    effect_only BOOLEAN DEFAULT false,
    predictor BOOLEAN DEFAULT false,
    outcome BOOLEAN DEFAULT false,
    
    -- Timestamps
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for commonly queried fields
CREATE INDEX idx_variable_categories_slug ON reference.variable_categories(slug);
CREATE INDEX idx_variable_categories_default_unit ON reference.variable_categories(default_unit_id);
CREATE INDEX idx_variable_categories_public ON reference.variable_categories(is_public) WHERE is_public = true;

-- Default categories
INSERT INTO reference.variable_categories 
(id, name, name_singular, description, synonyms, sort_order, is_public, boring, default_unit_id, minimum_allowed_value, maximum_allowed_value, 
minimum_allowed_seconds_between_measurements, filling_value, filling_type, duration_of_action, onset_delay, combination_operation, 
manual_tracking, valence, is_goal, controllable, cause_only, effect_only, predictor, outcome) VALUES
(1, 'Emotions', 'Emotion', NULL, '["Emotions","Emotion","Mood"]', 0, true, false, 10, NULL, NULL, 60, -1, 'none', 86400, 0, 'mean', true, 'neutral', 'never', 'never', false, NULL, false, true),
(2, 'Physique', '', NULL, '', 0, true, false, NULL, NULL, NULL, 86400, -1, 'none', 604800, 0, 'mean', false, 'positive', 'never', 'never', false, NULL, true, true),
(3, 'Physical Activity', '', NULL, '["Physical Activity","Physical Activities"]', 0, true, false, NULL, NULL, NULL, 3600, 0, 'zero', 86400, 0, 'sum', false, 'positive', 'never', 'never', false, NULL, true, true),
(4, 'Locations', '', NULL, '["Location","Locations"]', 0, false, true, 2, NULL, NULL, 600, 0, 'zero', 86400, 0, 'mean', false, 'positive', 'never', 'never', false, NULL, true, false),
(5, 'Miscellaneous', '', NULL, '["Miscellaneous","Uncategorized"]', 0, false, true, NULL, NULL, NULL, NULL, -1, NULL, 86400, 0, 'mean', false, 'positive', 'never', 'never', false, NULL, true, true),
(6, 'Sleep', '', NULL, '', 0, true, false, NULL, NULL, NULL, 86400, -1, 'none', 86400, 0, 'mean', false, 'positive', 'never', 'never', false, NULL, true, true),
(7, 'Social Interactions', '', NULL, '["Social Interactions","Social Interaction"]', 0, false, false, NULL, NULL, NULL, 60, 0, 'zero', 86400, 0, 'mean', false, 'positive', 'never', 'never', false, NULL, true, true),
(8, 'Vital Signs', '', NULL, '["Vital Signs","Vital Sign"]', 0, true, false, NULL, NULL, NULL, NULL, -1, 'none', 86400, 0, 'mean', false, 'positive', 'never', 'never', false, NULL, true, true),
(9, 'Cognitive Performance', '', NULL, '', 0, true, false, NULL, NULL, NULL, NULL, -1, 'none', 86400, 0, 'mean', true, 'positive', 'never', 'never', false, NULL, false, true),
(10, 'Symptoms', '', NULL, '["Symptoms","Symptom"]', 0, true, false, 10, NULL, NULL, 60, -1, 'none', 86400, 0, 'mean', true, 'negative', 'never', 'never', false, NULL, true, true),
(11, 'Nutrients', '', NULL, '["Nutrients","Nutrient"]', 0, true, false, 6, NULL, NULL, NULL, -1, 'none', 86400, 0, 'mean', false, 'positive', 'never', 'never', true, NULL, true, false),
(12, 'Goals', '', NULL, '["Work","Productivity","Goals","Goal"]', 0, false, false, NULL, NULL, NULL, 60, -1, 'none', 86400, 0, 'mean', false, 'positive', 'never', 'never', false, NULL, false, true),
(13, 'Treatments', '', NULL, '["Health and Beauty","Health & Beauty","Treatments","Treatment","HealthPersonalCare","Baby Product","Home"]', 0, true, false, 23, 0, NULL, 60, 0, 'zero', 86400, 1800, 'sum', true, 'positive', 'never', 'never', true, NULL, true, false),
(14, 'Activities', 'Activity', NULL, '["Activities","Activity"]', 0, false, false, 2, NULL, NULL, NULL, 0, 'zero', 86400, 0, 'sum', false, '', 'never', 'never', false, NULL, true, NULL),
(15, 'Foods', '', NULL, '["Grocery","Foods","Food","GourmetFood"]', 0, true, false, 44, 0, NULL, NULL, 0, 'zero', 864000, 1800, 'sum', true, 'positive', 'never', 'never', true, NULL, true, false),
(16, 'Conditions', '', NULL, '["Conditions","Condition"]', 0, true, false, NULL, NULL, NULL, NULL, -1, NULL, 86400, 0, 'mean', true, 'positive', 'never', 'never', false, NULL, false, true),
(17, 'Environment', '', NULL, '', 0, true, false, NULL, NULL, NULL, 86400, NULL, 'none', 86400, 0, 'mean', false, 'positive', 'never', 'never', true, NULL, true, false),
(18, 'Causes of Illness', '', NULL, '["Causes of Illness","Cause of Illness"]', 0, true, false, NULL, NULL, NULL, NULL, 0, 'zero', 86400, 0, 'mean', false, 'positive', 'never', 'never', false, NULL, true, false),
(19, 'Books', '', NULL, '["Books","Book"]', 0, true, true, NULL, NULL, NULL, NULL, 0, 'zero', 86400, 0, 'mean', false, 'positive', 'never', 'never', false, NULL, true, false),
(20, 'Software', '', NULL, '["Software & Mobile Apps","App","Software","Software & Mobile App","Software Usage"]', 0, false, true, 2, NULL, NULL, NULL, 0, 'zero', 86400, 0, 'sum', false, 'positive', 'never', 'never', false, NULL, true, false),
(32, 'Payments', '', NULL, '["Purchases","Payments","Payment","Purchase"]', 0, false, true, 49, NULL, NULL, NULL, 0, 'zero', 2592000, 0, 'sum', false, 'positive', 'never', 'never', false, NULL, true, false),
(42, 'Movies and TV', '', NULL, '', 0, true, true, NULL, NULL, NULL, NULL, 0, 'zero', 86400, 0, 'sum', false, 'positive', 'never', 'never', false, NULL, true, false),
(251, 'Music', '', NULL, '', 0, true, true, 23, NULL, NULL, NULL, 0, 'zero', 86400, 0, 'sum', false, 'positive', 'never', 'never', false, NULL, true, false),
(252, 'Electronics', '', NULL, '["Electronics","Electronic"]', 0, true, true, 23, 0, NULL, NULL, 0, 'zero', 604800, 1800, 'sum', false, 'positive', 'never', 'never', true, NULL, true, false),
(253, 'IT Metrics', '', NULL, '', 0, false, true, 23, NULL, NULL, NULL, -1, 'none', 86400, 0, 'sum', false, 'positive', 'never', 'never', false, false, true, false),
(254, 'Economic Indicators', '', NULL, '["Economic Data","Economic Indicators"]', 0, true, true, 15, NULL, NULL, NULL, -1, 'none', 86400, 0, 'mean', false, 'positive', 'never', 'never', false, false, true, true),
(255, 'Investment Strategies', '', NULL, '["Investment Strategy","Investment Strategies"]', 0, true, true, 21, NULL, NULL, NULL, -1, 'none', 86400, 0, 'mean', false, 'positive', 'never', 'never', false, false, true, true);

-- Enable Row Level Security
ALTER TABLE reference.variable_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Variable categories are viewable by all authenticated users"
    ON reference.variable_categories FOR SELECT
    USING (
        (is_public = true AND deleted_at IS NULL) OR 
        EXISTS (
            SELECT 1 FROM core.user_permissions up
            WHERE up.user_id = auth.uid()
            AND up.permission = 'view_medical'
        )
    );

CREATE POLICY "Admins can manage variable categories"
    ON reference.variable_categories FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_medical'
    )); 

-- Schema: reference, File: variable_ingredients.sql
-- Variable Ingredients
--
-- Defines compositional relationships between variables from various sources:
-- * Reference data (official formulations)
-- * User contributions
-- * Expert knowledge
-- * Aggregated data
--
-- Examples:
-- * Drug formulations (active and inactive ingredients)
-- * Nutritional compositions (ingredients in foods)
-- * Complex medical treatments (components of a treatment protocol)
--
CREATE TABLE reference.variable_ingredients (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    parent_variable_id bigint NOT NULL REFERENCES reference.variables(id),
    ingredient_variable_id bigint NOT NULL REFERENCES reference.variables(id),
    amount numeric,                    -- Specific amount of the ingredient
    unit_id bigint REFERENCES reference.units_of_measurement(id) ON DELETE RESTRICT,
    proportion DECIMAL,                -- Alternative to amount/unit for relative proportions
    is_active_ingredient BOOLEAN DEFAULT FALSE,  -- Particularly relevant for medications
    version_number INTEGER NOT NULL DEFAULT 1,   -- For tracking formulation changes
    source_type text NOT NULL CHECK (source_type IN ('reference', 'user', 'expert', 'aggregate')),
    source_id bigint,                    -- ID of the user/expert who contributed this
    confidence_score float CHECK (confidence_score >= 0 AND confidence_score <= 1),
    notes text,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(parent_variable_id, ingredient_variable_id, version_number, source_type),
    CONSTRAINT no_self_reference CHECK (parent_variable_id != ingredient_variable_id)
);

-- Enable RLS
ALTER TABLE reference.variable_ingredients ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view ingredients"
    ON reference.variable_ingredients FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert user contributions"
    ON reference.variable_ingredients FOR INSERT
    TO authenticated
    WITH CHECK (source_type = 'user' AND source_id = auth.uid());

CREATE POLICY "Users can update their own contributions"
    ON reference.variable_ingredients FOR UPDATE
    TO authenticated
    USING (source_type = 'user' AND source_id = auth.uid());

COMMENT ON TABLE reference.variable_ingredients IS 'Defines compositional relationships between variables from various sources';
COMMENT ON COLUMN reference.variable_ingredients.parent_variable_id IS 'The compound/composite variable (e.g., the medication or treatment)';
COMMENT ON COLUMN reference.variable_ingredients.ingredient_variable_id IS 'The component variable (e.g., the active ingredient)';
COMMENT ON COLUMN reference.variable_ingredients.amount IS 'Specific quantity of the ingredient when unit is specified';
COMMENT ON COLUMN reference.variable_ingredients.proportion IS 'Relative proportion (0-1) when exact amounts are not applicable';
COMMENT ON COLUMN reference.variable_ingredients.is_active_ingredient IS 'Indicates if this is an active ingredient in a medication or primary component in a treatment';
COMMENT ON COLUMN reference.variable_ingredients.version_number IS 'Tracks different versions of formulations or compositions';
COMMENT ON COLUMN reference.variable_ingredients.source_type IS 'Origin of the ingredient data (reference, user, expert, aggregate)';
COMMENT ON COLUMN reference.variable_ingredients.source_id IS 'ID of the user/expert who contributed this data';
COMMENT ON COLUMN reference.variable_ingredients.confidence_score IS 'Confidence in the accuracy of this ingredient relationship (0-1)'; 

-- Schema: reference, File: variable_relationships.sql
-- Variable relationships table storing known or hypothesized relationships between variables
-- from various sources (research papers, expert knowledge, aggregate analysis)
CREATE TABLE reference.variable_relationships (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    predictor_variable_id bigint NOT NULL REFERENCES reference.variables(id),
    outcome_variable_id bigint NOT NULL REFERENCES reference.variables(id),
    relationship_type text NOT NULL CHECK (relationship_type IN (
        'predicts', 'may_predict', 'treats', 'may_treat',
        'prevents', 'may_prevent', 'increases_risk_of', 'decreases_risk_of'
    )),
    source_type text NOT NULL CHECK (source_type IN ('reference', 'user', 'expert', 'aggregate')),
    source_id bigint, -- ID of the user, expert, or reference that provided this relationship
    confidence_score float CHECK (confidence_score >= 0 AND confidence_score <= 1),
    correlation_coefficient float,
    p_value float,
    number_of_studies integer,
    number_of_participants integer,
    onset_delay interval, -- Time until the predictor's effect on the outcome begins
    duration_of_action interval, -- How long the predictor's effect on the outcome lasts
    study_designs text[], -- Array of study types supporting this relationship
    references text[], -- Array of DOIs or URLs to supporting research
    notes text,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(predictor_variable_id, outcome_variable_id)
);

-- Index for faster lookups
CREATE INDEX ON reference.variable_relationships(predictor_variable_id);
CREATE INDEX ON reference.variable_relationships(outcome_variable_id);

-- Enable row level security
ALTER TABLE reference.variable_relationships ENABLE ROW LEVEL SECURITY;

-- Policies for different user roles
CREATE POLICY "Allow public read access" ON reference.variable_relationships
    FOR SELECT USING (true);

CREATE POLICY "Allow experts to insert" ON reference.variable_relationships
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' = 'expert'
        AND source_type = 'expert'
        AND source_id::text = (auth.jwt() ->> 'sub')
    );

CREATE POLICY "Allow experts to update own" ON reference.variable_relationships
    FOR UPDATE USING (
        auth.jwt() ->> 'role' = 'expert'
        AND source_type = 'expert'
        AND source_id::text = (auth.jwt() ->> 'sub')
    );

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_variable_relationships_updated_at
    BEFORE UPDATE ON reference.variable_relationships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE reference.variable_relationships IS 'Stores relationships between variables from various sources including research, expert knowledge, and aggregate analysis.';
COMMENT ON COLUMN reference.variable_relationships.predictor_variable_id IS 'The variable that may predict or influence the outcome variable';
COMMENT ON COLUMN reference.variable_relationships.outcome_variable_id IS 'The variable that may be predicted or influenced by the predictor variable';
COMMENT ON COLUMN reference.variable_relationships.relationship_type IS 'The type of relationship (predicts, treats, prevents, etc.)';
COMMENT ON COLUMN reference.variable_relationships.confidence_score IS 'Score between 0-1 indicating confidence in this relationship based on evidence quality';
COMMENT ON COLUMN reference.variable_relationships.onset_delay IS 'Expected time delay before the predictor variable shows correlation with the outcome';
COMMENT ON COLUMN reference.variable_relationships.duration_of_action IS 'Expected duration of correlation between predictor and outcome'; 

-- Schema: reference, File: variable_synonyms.sql
-- Variable Synonyms
--
-- Defines alternative names and translations for variables from various sources:
-- * Reference data (official names and translations)
-- * User contributions
-- * Expert knowledge
-- * Aggregated data
--
-- This table supports:
-- * Common alternative names (e.g., "Vitamin C" for "Ascorbic Acid")
-- * Brand names (e.g., "Tylenol" for "Acetaminophen")
-- * Abbreviations (e.g., "BP" for "Blood Pressure")
-- * Translations in different languages
-- * Regional naming variations
--
CREATE TABLE reference.variable_synonyms (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    variable_id bigint NOT NULL REFERENCES reference.variables(id),
    name text NOT NULL,                -- Alternative name or translation
    language_code text NOT NULL DEFAULT 'en',  -- ISO 639-1 language code
    source_type text NOT NULL CHECK (source_type IN ('reference', 'user', 'expert', 'aggregate')),
    source_id bigint,                    -- ID of the user/expert who contributed this
    confidence_score float CHECK (confidence_score >= 0 AND confidence_score <= 1),
    notes text,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(variable_id, name, language_code)
);

-- Enable RLS
ALTER TABLE reference.variable_synonyms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view synonyms"
    ON reference.variable_synonyms FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert user contributions"
    ON reference.variable_synonyms FOR INSERT
    TO authenticated
    WITH CHECK (source_type = 'user' AND source_id = auth.uid());

CREATE POLICY "Users can update their own contributions"
    ON reference.variable_synonyms FOR UPDATE
    TO authenticated
    USING (source_type = 'user' AND source_id = auth.uid());

COMMENT ON TABLE reference.variable_synonyms IS 'Alternative names and translations for variables from various sources';
COMMENT ON COLUMN reference.variable_synonyms.variable_id IS 'Reference to the canonical variable';
COMMENT ON COLUMN reference.variable_synonyms.name IS 'Alternative name, translation, or abbreviation for the variable';
COMMENT ON COLUMN reference.variable_synonyms.language_code IS 'ISO 639-1 language code (e.g., en, es, fr)';
COMMENT ON COLUMN reference.variable_synonyms.source_type IS 'Origin of the synonym data (reference, user, expert, aggregate)';
COMMENT ON COLUMN reference.variable_synonyms.source_id IS 'ID of the user/expert who contributed this data';
COMMENT ON COLUMN reference.variable_synonyms.confidence_score IS 'Confidence in the accuracy of this synonym (0-1)'; 

-- Schema: scheduling, File: appointments.sql
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

-- Enable Row Level Security
ALTER TABLE scheduling.appointments ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Schema: scheduling, File: appointment_feedback.sql
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
ALTER TABLE scheduling.appointment_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Schema: scheduling, File: appointment_reminders.sql
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

-- Enable Row Level Security
ALTER TABLE scheduling.appointment_reminders ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Schema: scheduling, File: provider_schedules.sql
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

-- Enable Row Level Security
ALTER TABLE scheduling.provider_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Schema: scheduling, File: provider_services.sql
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

-- Enable Row Level Security
ALTER TABLE scheduling.provider_services ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Schema: scheduling, File: schedule_exceptions.sql
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

-- Enable Row Level Security
ALTER TABLE scheduling.schedule_exceptions ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Schema: scheduling, File: scheduling_schema.sql
-- =============================================
-- SCHEDULING SCHEMA - Appointment Scheduling
-- =============================================

CREATE SCHEMA IF NOT EXISTS scheduling; 

-- Schema: scheduling, File: service_providers.sql
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

-- Enable Row Level Security
ALTER TABLE scheduling.service_providers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Active providers are viewable by all"
    ON scheduling.service_providers FOR SELECT
    USING (is_active = true);

CREATE POLICY "Providers can manage their own profile"
    ON scheduling.service_providers FOR ALL
    USING (auth.uid() = user_id); 

-- Schema: scheduling, File: service_types.sql
-- Service Types
--
-- Defines types of medical services offered
-- Used for scheduling and service management
--
CREATE TABLE scheduling.service_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default service types
INSERT INTO scheduling.service_types (name, description, duration_minutes, is_active) VALUES
('initial_consultation', 'Initial medical consultation', 60, true),
('follow_up', 'Follow-up appointment', 30, true),
('lab_review', 'Laboratory results review', 30, true),
('treatment_session', 'Treatment session', 45, true),
('emergency_consultation', 'Emergency consultation', 60, true);

-- Enable Row Level Security
ALTER TABLE scheduling.service_types ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Schema: seeds, File: muscle_mass_impact_seed.sql
-- Muscle Mass Impact Analysis Seeder

-- 1. Add necessary variables to reference schema
INSERT INTO reference.variables (name, display_name, description, unit_id, category_id)
VALUES 
    ('muscle_mass_gain', 'Muscle Mass Gain', 'Amount of muscle mass gained through intervention', 
        (SELECT id FROM reference.units_of_measurement WHERE name = 'pounds'),
        (SELECT id FROM reference.variable_categories WHERE name = 'physical_metrics')),
    ('muscle_calorie_burn', 'Muscle Calorie Burn Rate', 'Calories burned per pound of muscle per day',
        (SELECT id FROM reference.units_of_measurement WHERE name = 'calories_per_day'),
        (SELECT id FROM reference.variable_categories WHERE name = 'metabolic_metrics'))
RETURNING id AS muscle_mass_id, (SELECT id FROM reference.variables ORDER BY id DESC LIMIT 1) AS calorie_burn_id;

-- 2. Create parameter set for the analysis
INSERT INTO models.parameter_sets (
    name,
    description,
    parameters,
    time_horizon_years,
    discount_rate
)
VALUES (
    'muscle_mass_impact_2025',
    'Muscle Mass Intervention Analysis - 2025 Baseline',
    jsonb_build_object(
        'muscle_mass_increase', 2.0,
        'muscle_calorie_burn_rate', 8.0,
        'baseline_rmr', 1800,
        'insulin_sensitivity_per_lb', 0.02,
        'fall_risk_reduction_per_lb', 0.015,
        'mortality_reduction_per_lb', 0.01,
        'population_size', 335000000,
        'healthcare_cost_per_fall', 10000,
        'annual_fall_risk', 0.15,
        'annual_healthcare_cost', 11000,
        'productivity_gain_per_lb', 100,
        'qaly_value', 100000
    ),
    10, -- 10 year horizon
    0.03 -- 3% discount rate
)
RETURNING id as param_set_id;

-- 3. Add population demographics
INSERT INTO models.population_demographics (
    parameter_set_id,
    age_group,
    population_count,
    risk_multiplier
)
SELECT 
    param_set_id,
    age_group,
    population_count,
    risk_multiplier
FROM (
    VALUES 
        ('Under 45', 180900000, 0.6),
        ('45-64', 100500000, 1.0),
        ('65-74', 30150000, 1.5),
        ('75-84', 16750000, 2.0),
        ('85+', 6700000, 3.0)
) as demographics(age_group, population_count, risk_multiplier)
CROSS JOIN (SELECT id as param_set_id FROM models.parameter_sets WHERE name = 'muscle_mass_impact_2025') ps;

-- 4. Add intervention effects
INSERT INTO models.intervention_effects (
    intervention_variable_id,
    outcome_variable_id,
    effect_type,
    effect_size,
    confidence_interval_low,
    confidence_interval_high
)
SELECT 
    v_muscle.id as intervention_variable_id,
    v_outcome.id as outcome_variable_id,
    'direct' as effect_type,
    effect_size,
    ci_low,
    ci_high
FROM (
    VALUES 
        ('insulin_sensitivity', 0.04, 0.03, 0.05),
        ('fall_risk', 0.03, 0.023, 0.038),
        ('mortality_risk', 0.02, 0.015, 0.025)
) as effects(outcome_name, effect_size, ci_low, ci_high)
CROSS JOIN (SELECT id FROM reference.variables WHERE name = 'muscle_mass_gain') v_muscle
JOIN reference.variables v_outcome ON v_outcome.name = effects.outcome_name;

-- 5. Add cost breakdowns
INSERT INTO models.cost_breakdowns (
    parameter_set_id,
    population_segment_id,
    cost_category,
    subcategory,
    amount,
    percentage_of_total
)
SELECT 
    ps.id as parameter_set_id,
    pd.id as population_segment_id,
    cost_category,
    subcategory,
    amount,
    percentage_of_total
FROM (
    VALUES 
        ('healthcare_savings', 'fall_related', 16234267500, 15.8),
        ('healthcare_savings', 'diabetes_related', 31429541880, 30.6),
        ('healthcare_savings', 'hospitalization', 7341496525, 7.1),
        ('healthcare_savings', 'mortality_related', 5826298225, 5.7),
        ('healthcare_savings', 'general_utilization', 41848334000, 40.8),
        ('productivity_gains', 'cognitive_performance', 31089649272, 100.0),
        ('qaly_value', 'lifetime_qalys', 4558599600, 100.0)
) as costs(cost_category, subcategory, amount, percentage_of_total)
CROSS JOIN (SELECT id FROM models.parameter_sets WHERE name = 'muscle_mass_impact_2025') ps
CROSS JOIN (SELECT id FROM models.population_demographics LIMIT 1) pd;

-- 6. Add parameter sources
INSERT INTO models.parameter_sources (
    parameter_set_id,
    intervention_effect_id,
    citation,
    quality_score,
    methodology_notes
)
SELECT 
    ps.id as parameter_set_id,
    ie.id as intervention_effect_id,
    'pmc.ncbi.nlm.nih.gov',
    0.85,
    'Based on systematic review and meta-analysis'
FROM models.parameter_sets ps
CROSS JOIN models.intervention_effects ie
WHERE ps.name = 'muscle_mass_impact_2025';

-- 7. Add simulation outputs
INSERT INTO models.simulation_outputs (
    parameter_set_id,
    population_segment_id,
    intervention_variable_id,
    outcome_variable_id,
    value,
    confidence_interval_low,
    confidence_interval_high,
    is_qaly_calculation,
    total_qalys,
    qaly_monetary_value
)
SELECT 
    ps.id as parameter_set_id,
    pd.id as population_segment_id,
    v_muscle.id as intervention_variable_id,
    v_outcome.id as outcome_variable_id,
    2.0 as value, -- 2 lbs muscle mass gain
    1.5 as confidence_interval_low,
    2.5 as confidence_interval_high,
    true as is_qaly_calculation,
    0.01 as total_qalys, -- Based on calculation in report
    100000 as qaly_monetary_value
FROM models.parameter_sets ps
CROSS JOIN models.population_demographics pd
CROSS JOIN (SELECT id FROM reference.variables WHERE name = 'muscle_mass_gain') v_muscle
CROSS JOIN (SELECT id FROM reference.variables WHERE name IN ('insulin_sensitivity', 'fall_risk', 'mortality_risk')) v_outcome
WHERE ps.name = 'muscle_mass_impact_2025'; 

-- Schema: views, File: muscle_mass_impact_report.sql
-- Comprehensive view for muscle mass impact report
CREATE OR REPLACE VIEW models.muscle_mass_impact_report AS
WITH 
-- Get the parameter set
params AS (
    SELECT 
        id,
        parameters,
        time_horizon_years,
        discount_rate
    FROM models.parameter_sets 
    WHERE name = 'muscle_mass_impact_2025'
),
-- Daily metabolic impact
metabolic_daily AS (
    SELECT 
        dmi.*,
        p.parameters->>'baseline_rmr' as baseline_rmr
    FROM models.daily_metabolic_impact dmi
    CROSS JOIN params p
    WHERE dmi.parameter_set_id = p.id
),
-- Health outcomes summary
health_outcomes AS (
    SELECT 
        outcome_name,
        effect_size,
        min_effect as best_case,
        max_effect as worst_case,
        source
    FROM models.health_outcomes
    WHERE parameter_set_id = (SELECT id FROM params)
),
-- Economic impact summary
economic_impact AS (
    SELECT 
        cost_category,
        subcategory,
        SUM(adjusted_amount) as total_amount,
        STRING_AGG(DISTINCT source, ', ') as sources
    FROM models.cost_breakdown_summary
    WHERE parameter_set_id = (SELECT id FROM params)
    GROUP BY cost_category, subcategory
),
-- Medicare impact
medicare_impact AS (
    SELECT 
        age_group,
        savings_amount,
        savings_per_beneficiary,
        beneficiary_count
    FROM models.medicare_impact_summary
    WHERE parameter_set_id = (SELECT id FROM params)
),
-- QALY impact
qaly_summary AS (
    SELECT 
        SUM(total_qalys) as total_qalys,
        SUM(monetary_value) as monetary_value,
        MIN(min_qalys) as min_qalys,
        MAX(max_qalys) as max_qalys
    FROM models.qaly_impact_summary
    WHERE parameter_set_id = (SELECT id FROM params)
),
-- Long term projections
long_term AS (
    SELECT 
        time_horizon_years,
        discount_rate,
        present_value as total_npv
    FROM models.long_term_projections
    WHERE parameter_set_id = (SELECT id FROM params)
)
SELECT 
    -- Intervention Details
    p.parameters->>'muscle_mass_increase' as muscle_mass_increase_lbs,
    p.parameters->>'population_size' as target_population,
    
    -- Metabolic Impact
    md.calories_per_day as daily_calories_burned,
    md.min_calories as daily_calories_min,
    md.max_calories as daily_calories_max,
    md.baseline_rmr as baseline_metabolic_rate,
    
    -- Health Outcomes
    json_build_object(
        'insulin_sensitivity', (SELECT json_build_object(
            'improvement', effect_size,
            'best_case', best_case,
            'worst_case', worst_case
        ) FROM health_outcomes WHERE outcome_name = 'insulin_sensitivity'),
        'fall_risk', (SELECT json_build_object(
            'reduction', effect_size,
            'best_case', best_case,
            'worst_case', worst_case
        ) FROM health_outcomes WHERE outcome_name = 'fall_risk'),
        'mortality_risk', (SELECT json_build_object(
            'reduction', effect_size,
            'best_case', best_case,
            'worst_case', worst_case
        ) FROM health_outcomes WHERE outcome_name = 'mortality_risk')
    ) as health_outcomes,
    
    -- Economic Impact
    json_build_object(
        'healthcare_savings', (
            SELECT json_object_agg(subcategory, total_amount)
            FROM economic_impact
            WHERE cost_category = 'healthcare_savings'
        ),
        'productivity_gains', (
            SELECT json_object_agg(subcategory, total_amount)
            FROM economic_impact
            WHERE cost_category = 'productivity_gains'
        ),
        'qaly_value', (
            SELECT json_object_agg(subcategory, total_amount)
            FROM economic_impact
            WHERE cost_category = 'qaly_value'
        )
    ) as economic_impact,
    
    -- Medicare Impact
    json_build_object(
        'total_savings', (SELECT SUM(savings_amount) FROM medicare_impact),
        'beneficiary_count', (SELECT SUM(beneficiary_count) FROM medicare_impact),
        'savings_per_beneficiary', (
            SELECT SUM(savings_amount) / NULLIF(SUM(beneficiary_count), 0) 
            FROM medicare_impact
        ),
        'age_distribution', (
            SELECT json_object_agg(age_group, json_build_object(
                'savings', savings_amount,
                'beneficiaries', beneficiary_count
            ))
            FROM medicare_impact
        )
    ) as medicare_impact,
    
    -- QALY Impact
    json_build_object(
        'total_qalys', total_qalys,
        'monetary_value', monetary_value,
        'min_qalys', min_qalys,
        'max_qalys', max_qalys
    ) as qaly_impact,
    
    -- Long Term Impact
    json_build_object(
        'time_horizon_years', time_horizon_years,
        'discount_rate', discount_rate,
        'total_npv', total_npv
    ) as long_term_impact,
    
    -- Metadata
    CURRENT_TIMESTAMP as report_generated_at,
    'v1.0' as report_version
FROM 
    params p
    CROSS JOIN metabolic_daily md
    CROSS JOIN qaly_summary qs
    CROSS JOIN long_term lt;

-- Add helpful comments
COMMENT ON VIEW models.muscle_mass_impact_report IS 'Comprehensive view that generates the complete muscle mass intervention impact analysis report';

-- Create a refresh function for the report
CREATE OR REPLACE FUNCTION models.refresh_muscle_mass_report()
RETURNS void AS $$
BEGIN
    -- Refresh all underlying materialized views
    PERFORM models.refresh_all_calculation_views();
END;
$$ LANGUAGE plpgsql; 
