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

- [ ] Create `patient_health_goals` table:
```sql
CREATE TABLE patient_health_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_value DECIMAL,
  current_value DECIMAL,
  unit TEXT,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  target_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

- [ ] Create `learning_resources` table:
```sql
CREATE TABLE learning_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL,
  content_url TEXT,
  content TEXT,
  related_condition_id UUID REFERENCES conditions(id),
  related_treatment_id UUID REFERENCES treatments(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES profiles(id)
);
```

- [ ] Create `patient_learning_progress` table:
```sql
CREATE TABLE patient_learning_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES learning_resources(id) ON DELETE CASCADE,
  progress_percent INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  last_accessed TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

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

## E-commerce Module (Optional)

- [ ] Create `products` table:
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  treatment_id UUID REFERENCES treatments(id),
  manufacturer TEXT,
  batch_lot_info TEXT,
  sku TEXT,
  price DECIMAL,
  inventory_count INTEGER,
  is_prescription_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

- [ ] Create `orders` table:
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  order_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL,
  total_amount DECIMAL,
  shipping_address JSONB,
  billing_address JSONB,
  payment_method_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

- [ ] Create `order_items` table:
```sql
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price_per_unit DECIMAL NOT NULL,
  batch_lot_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

- [ ] Create `cart_items` table:
```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

- [ ] Modify `measurements` table to link with purchases:
```sql
ALTER TABLE measurements
ADD COLUMN order_item_id UUID REFERENCES order_items(id);
```

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