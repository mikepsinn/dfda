# Implementation Plan for DFDA Node Refactoring

This document outlines the step-by-step implementation plan to refactor the DFDA Node application according to the requirements in `refactoring-plan.md`. The implementation is divided into phases with clear deliverables and priorities.

## Phase 1: Route Structure Refactoring

### 1.1 Setup Route Groups (Priority: High)
- [x] Create route group directories: `/(public)`, `/(auth)`, and `/(shared)`
- [x] Create basic layout files for each route group
- [ ] Move/copy homepage to public route group
- [ ] Test route groups with minimal content to ensure proper rendering

### 1.2 Move Public Routes (Priority: High)
- [ ] Move terms -> (public)/terms
- [ ] Move privacy -> (public)/privacy
- [ ] Move contact -> (public)/contact
- [ ] Move impact -> (public)/impact
- [ ] Move find-trials -> (public)/find-trials
- [ ] Move conditions -> (public)/conditions
- [ ] Move treatment -> (public)/treatment
- [ ] Move outcome-labels -> (public)/outcome-labels
- [ ] Test all moved routes to ensure proper functioning

### 1.3 Move Authentication Routes (Priority: High)
- [ ] Move login -> (auth)/login
- [ ] Move register -> (auth)/register
- [ ] Move forgot-password -> (auth)/forgot-password
- [ ] Test authentication flow with moved routes

### 1.4 Setup Shared Routes (Priority: Medium)
- [ ] Move (protected)/user -> (shared)/user
- [ ] Create templates for shared routes: profile, dashboard, notifications, settings
- [ ] Test shared routes with basic rendering

## Phase 2: Feature Refactoring and Enhancement

### 2.1 Research Partner Role Enhancement (Priority: Medium)
- [ ] Review existing research partner functionality
- [ ] Enhance research partner routes for trial management features
- [ ] Test enhanced research partner functionality

### 2.2 Developer Role Enhancement (Priority: Medium)
- [ ] Review existing developer functionality
- [ ] Enhance developer routes and API access features
- [ ] Test enhanced developer functionality  

### 2.3 Admin Role Expansion (Priority: Medium)
- [ ] Create templates for enhanced admin routes (users, roles, billing, analytics, etc.)
- [ ] Implement basic UI for new admin features
- [ ] Implement module management UI (/admin/module-management)
- [ ] Test extended admin functionality

### 2.4 Component Refactoring (Priority: Medium)
- [ ] Identify components in app subdirectories that should be moved to root
- [ ] Move/refactor patient components to root components directory
- [ ] Move/refactor provider components to root components directory
- [ ] Update imports in all affected files
- [ ] Test components in their new locations

## Phase 3: Database Schema Refactoring

### 3.1 User Roles and Policies (Priority: High)
- [ ] Review and enhance policies for all existing roles
- [ ] Ensure appropriate access control for each role
- [ ] Test updated roles and policies

### 3.2 API Management (Priority: Medium)
- [ ] Create api_keys table
- [ ] Ensure OAuth tables are properly maintained
- [ ] Implement management UI for API key management
- [ ] Test API key functionality

### 3.3 Patient Data Expansion (Priority: Medium)
- [ ] Create patient_food_log table
- [ ] Create patient_activity_log table
- [ ] Create patient_condition_events table
- [ ] Create patient_data_import_sources table
- [ ] Create patient_insights table
- [ ] Create patient_health_goals table
- [ ] Create learning_resources table
- [ ] Create patient_learning_progress table
- [ ] Implement basic UI for patient data logging
- [ ] Test patient data functionality

### 3.4 Module Infrastructure (Priority: Medium)
- [ ] Create instance_settings table
- [ ] Create instance_module_activations table
- [ ] Create instance_network_config table
- [ ] Implement module activation/deactivation logic
- [ ] Test module infrastructure

### 3.5 Module-Specific Tables (Priority: Low)
- [ ] Create AI Doctor module tables (if module planned for early implementation)
- [ ] Create E-commerce module tables (if module planned for early implementation)
- [ ] Test module-specific functionality

## Phase 4: Feature Implementation for Core Modules

### 4.1 Patient Core Features (Priority: High)
- [ ] Implement enhanced patient dashboard
- [ ] Implement comprehensive health logging
- [ ] Implement data import connections
- [ ] Implement trial enrollment and management
- [ ] Test patient core features

### 4.2 Provider Core Features (Priority: High)
- [ ] Implement provider dashboard
- [ ] Implement patient management within trials
- [ ] Implement data view and analysis tools
- [ ] Test provider core features

### 4.3 Admin Core Features (Priority: High)
- [ ] Implement trial management
- [ ] Implement user management
- [ ] Implement billing and usage monitoring
- [ ] Implement instance configuration
- [ ] Test admin core features

## Phase 5: Optional Module Implementation

### 5.1 AI Doctor Module (Priority: Low)
- [ ] Implement patient AI Doctor interface
- [ ] Implement provider AI consultation interface
- [ ] Implement session sharing functionality
- [ ] Test AI Doctor module

### 5.2 E-commerce Module (Priority: Low)
- [ ] Implement product catalog
- [ ] Implement shopping cart
- [ ] Implement checkout process
- [ ] Implement order management
- [ ] Test E-commerce module

### 5.3 Network Insights Module (Priority: Low)
- [ ] Implement data contribution mechanism
- [ ] Implement insights display
- [ ] Test Network Insights module

## Implementation Notes

1. **Database Migrations**:
   - Create a test branch before applying schema changes
   - Apply changes incrementally
   - Test thoroughly after each change
   - Create proper up/down migrations

2. **Code Organization**:
   - Use the PowerShell script for initial structure moves
   - Review each file being moved for necessary import path updates
   - Consider breaking changes in components that are moved

3. **Testing Strategy**:
   - Test each route group after moving
   - Test authentication flows thoroughly
   - Test admin functionality with focus on role-based access
   - Test database schema changes with sample data

4. **Deployment Considerations**:
   - Plan for data migration in production
   - Consider incremental deployment of features
   - Prepare rollback strategy for each phase 