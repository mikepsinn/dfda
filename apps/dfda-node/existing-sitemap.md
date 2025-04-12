# Current Project Structure

This document outlines the existing directory structure of the dfda-node app before refactoring.

## Route Groups
- app/(protected)
  - Patient dashboard and user profile routes
- app/(public) (newly created)
- app/(shared) (newly created)
- app/(auth) (newly created)

## Core Routes
- app/actions (Server actions)
- app/admin (Admin functionality)
- app/auth (Authentication related)
  - app/auth/callback
- app/lib (Library functions)
  - app/lib/supabase

## Public Content Routes
- app/conditions (Condition information)
  - app/conditions/[conditionId]
  - app/conditions/[conditionId]/trials
- app/contact (Contact page)
- app/developers (Developer portal)
  - app/developers/documentation
- app/find-trials (Public trial finder)
- app/impact (Impact statistics)
- app/outcome-labels (Outcome labels)
- app/privacy (Privacy policy)
- app/terms (Terms of service)
- app/treatment (Treatment information)
  - app/treatment/[id]
  - app/treatment/[id]/components

## Authentication Routes
- app/login (Login page)
- app/register (Registration page)
- app/forgot-password (Password recovery)

## Role-Based Routes

### Patient Routes
- app/patient (Patient-specific features)
  - app/patient/data-submission
  - app/patient/find-trials
  - app/patient/join-trial
  - app/patient/join-trial/[treatment]
  - app/patient/join-trial/[treatment]/[condition]
  - app/patient/treatments
  - app/patient/trial-details
  - app/patient/trial-details/[id]
  - app/patient/trial-payment
  - app/patient/trial-payment/[id]

### Provider Routes
- app/provider (Provider features)
  - app/provider/
  - app/provider/ehr-authorization
  - app/provider/ehr-authorization/[patientId]
  - app/provider/find-trials
  - app/provider/form-management
  - app/provider/form-management/create
  - app/provider/intervention-assignment
  - app/provider/intervention-assignment/[patientId]
  - app/provider/patients
  - app/provider/patients/[id]
  - app/provider/patients/[id]/enroll
- app/provider-resources (Provider resources)

### Research Partner Routes
- app/research-partner (Research partner features)
  - app/research-partner/create-trial
  - app/research-partner/
  - app/research-partner/trials
  - app/research-partner/trials/[id]
  - app/research-partner/trials/[id]/results
