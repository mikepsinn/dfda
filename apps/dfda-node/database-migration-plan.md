# Database Migration Plan

This document outlines the database schema changes required to support the refactored architecture.

## Roles & Policies

### User Types
- [ ] Keep all existing user types: `admin`, `provider`, `patient`, `research-partner`, `developer`
- [ ] Enhance policies for existing roles as needed

### RLS Policies
- [ ] Review and update all RLS policies to reflect enhanced role capabilities
- [ ] Ensure appropriate access control for each role type

## API Access & OAuth

### OAuth Tables 
- [ ] Keep OAuth tables for future Patient-Facing API with SMART on FHIR:
  - `oauth_clients`
  - `oauth_access_tokens`
  - `oauth_refresh_tokens`
  - `oauth_scopes`

### API Keys
- [ ] Create `api_keys` table for instance-level API key management:
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  key TEXT NOT NULL,
  scope TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  last_used_at TIMESTAMP WITH TIME ZONE
);
```

## Patient Data Expansion

- [ ] Create `patient_food_log` table:
```sql
CREATE TABLE patient_food_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  food_name TEXT NOT NULL,
  quantity DECIMAL,
  unit TEXT,
  calories INTEGER,
  protein DECIMAL,
  carbs DECIMAL,
  fat DECIMAL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

- [ ] Create `patient_activity_log` table:
```sql
CREATE TABLE patient_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  duration INTEGER,
  intensity TEXT,
  calories_burned INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

- [ ] Create `patient_condition_events` table:
```sql
CREATE TABLE patient_condition_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  condition_id UUID REFERENCES conditions(id),
  event_type TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  severity INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

- [ ] Create `patient_data_import_sources` table:
```sql
CREATE TABLE patient_data_import_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  auth_token TEXT,
  status TEXT NOT NULL,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

- [ ] Create `patient_insights` table:
```sql
CREATE TABLE patient_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL,
  insight_text TEXT NOT NULL,
  confidence_score DECIMAL,
  data_sources JSONB,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  viewed_at TIMESTAMP WITH TIME ZONE,
  is_hidden BOOLEAN DEFAULT false
);
```

## Deferred Patient Features (For Later Phases)

The following tables are deferred to later implementation phases:

- [ ] **Deferred:** `patient_health_goals` table
- [ ] **Deferred:** `learning_resources` table 
- [ ] **Deferred:** `patient_learning_progress` table

## AI Doctor Module

- [ ] Create `ai_doctor_sessions` table:
```sql
CREATE TABLE ai_doctor_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  transcript_path TEXT,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

- [ ] Create `ai_doctor_sharing_permissions` table:
```sql
CREATE TABLE ai_doctor_sharing_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES ai_doctor_sessions(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  permission_level TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## E-commerce Module (Deferred to Later Phase)

The following E-commerce related tables are deferred to later implementation phases:

- [ ] **Deferred:** `products` table
- [ ] **Deferred:** `orders` table
- [ ] **Deferred:** `order_items` table
- [ ] **Deferred:** `cart_items` table
- [ ] **Deferred:** Add `order_item_id` column to `measurements` table

## Instance Configuration

- [ ] Create `instance_settings` table:
```sql
CREATE TABLE instance_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT NOT NULL,
  setting_value JSONB,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (setting_key)
);
```

- [ ] Create `instance_module_activations` table:
```sql
CREATE TABLE instance_module_activations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  activation_date TIMESTAMP WITH TIME ZONE,
  expiration_date TIMESTAMP WITH TIME ZONE,
  activation_key TEXT,
  settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (module_name)
);
```

- [ ] Create `instance_network_config` table:
```sql
CREATE TABLE instance_network_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  is_connected_to_network BOOLEAN DEFAULT false,
  data_contribution_enabled BOOLEAN DEFAULT false,
  contribution_rules JSONB,
  network_api_key TEXT,
  last_contribution_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Traceability

- [ ] Update `treatments` table with source tracking fields:
```sql
ALTER TABLE treatments
ADD COLUMN manufacturer TEXT,
ADD COLUMN source_verification_method TEXT,
ADD COLUMN regulatory_status TEXT;
```

## General Review Items

- [ ] Review `trials` table for any necessary column additions
- [ ] Review `measurements` table for any necessary column additions
- [ ] Review `conditions` table for any necessary column additions
- [ ] Review existing functions and views for compatibility with schema changes

## Migration Strategy

1. Create a test branch first
2. Apply schema changes incrementally
3. Test thoroughly after each change
4. Develop scripts to migrate data as needed
5. Create proper up/down migrations
6. Document all changes

## Potential Challenges

- Enum type changes require careful handling
- RLS policy updates must be comprehensive to maintain security
- Data migration for merged roles needs careful planning
- Consider performance implications of new tables 