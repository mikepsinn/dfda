# Current Project Structure

This document outlines the existing directory structure of the dfda-node app before refactoring.

## Route Groups
- apps/dfda-node/app/(protected)
  - Patient dashboard and user profile routes
- apps/dfda-node/app/(public) (newly created)
- apps/dfda-node/app/(shared) (newly created)
- apps/dfda-node/app/(auth) (newly created)

## Core Routes
- apps/dfda-node/app/actions (Server actions)
- apps/dfda-node/app/admin (Admin functionality)
- apps/dfda-node/app/auth (Authentication related)
  - apps/dfda-node/app/auth/callback
- apps/dfda-node/app/lib (Library functions)
  - apps/dfda-node/app/lib/supabase

## Public Content Routes
- apps/dfda-node/app/conditions (Condition information)
  - apps/dfda-node/app/conditions/[conditionId]
  - apps/dfda-node/app/conditions/[conditionId]/trials
- apps/dfda-node/app/contact (Contact page)
- apps/dfda-node/app/developers (Developer portal)
  - apps/dfda-node/app/developers/documentation
- apps/dfda-node/app/find-trials (Public trial finder)
- apps/dfda-node/app/impact (Impact statistics)
- apps/dfda-node/app/outcome-labels (Outcome labels)
- apps/dfda-node/app/privacy (Privacy policy)
- apps/dfda-node/app/terms (Terms of service)
- apps/dfda-node/app/treatment (Treatment information)
  - apps/dfda-node/app/treatment/[id]
  - apps/dfda-node/app/treatment/[id]/components

## Authentication Routes
- apps/dfda-node/app/login (Login page)
- apps/dfda-node/app/register (Registration page)
- apps/dfda-node/app/forgot-password (Password recovery)

## Role-Based Routes

### Patient Routes
- apps/dfda-node/app/patient (Patient-specific features)
  - apps/dfda-node/app/patient/data-submission
  - apps/dfda-node/app/patient/find-trials
  - apps/dfda-node/app/patient/join-trial
  - apps/dfda-node/app/patient/join-trial/[treatment]
  - apps/dfda-node/app/patient/join-trial/[treatment]/[condition]
  - apps/dfda-node/app/patient/treatments
  - apps/dfda-node/app/patient/trial-details
  - apps/dfda-node/app/patient/trial-details/[id]
  - apps/dfda-node/app/patient/trial-payment
  - apps/dfda-node/app/patient/trial-payment/[id]

### Provider Routes
- apps/dfda-node/app/provider (Provider features)
  - apps/dfda-node/app/provider/dashboard
  - apps/dfda-node/app/provider/ehr-authorization
  - apps/dfda-node/app/provider/ehr-authorization/[patientId]
  - apps/dfda-node/app/provider/find-trials
  - apps/dfda-node/app/provider/form-management
  - apps/dfda-node/app/provider/form-management/create
  - apps/dfda-node/app/provider/intervention-assignment
  - apps/dfda-node/app/provider/intervention-assignment/[patientId]
  - apps/dfda-node/app/provider/patients
  - apps/dfda-node/app/provider/patients/[id]
  - apps/dfda-node/app/provider/patients/[id]/enroll
- apps/dfda-node/app/provider-resources (Provider resources)

### Research Partner Routes (To be removed/merged)
- apps/dfda-node/app/research-partner (Research partner features)
  - apps/dfda-node/app/research-partner/create-trial
  - apps/dfda-node/app/research-partner/dashboard
  - apps/dfda-node/app/research-partner/trials
  - apps/dfda-node/app/research-partner/trials/[id]
  - apps/dfda-node/app/research-partner/trials/[id]/results
