# Project Vision & Plan: Decentralized FDA (dFDA) Network & Platform

## 1. Vision & Goals

*   **Goal:** Create a decentralized network (dFDA) of interoperable health data nodes to accelerate medical research, improve treatment effectiveness, and empower patients.
*   **Core Product:** A white-labeled **Trial & Health Management Platform** (`dfda-node`) offered as a SaaS product to various organizations (pharma, clinics, research institutions, non-profits).
*   **Network Effect:** Each platform instance acts as a dFDA node, contributing anonymized, aggregated data (with consent) to a central dFDA database.
*   **Value Proposition:**
    *   **For Organizations:** Efficient trial management, enhanced patient engagement, access to AI tools, optional insights from the broader dFDA network, simplified third-party data integration via central service.
    *   **For Patients:** Comprehensive health tracking, personalized insights, AI Doctor access (optional), contribution to research, easy connection to health apps/devices.
    *   **For the Ecosystem:** Accelerated research through aggregated real-world data, supply chain traceability for treatments.
*   **Monetization:** Sustainable revenue through a hybrid SaaS model (subscriptions + usage + optional modules) to fund development, AI capabilities, and network growth.
*   **Technology:** Leverage AI (agents, AI Doctor, causal inference), potentially blockchain/decentralized identity concepts where appropriate (though not strictly required for MVP).

## Environment Setup

This project requires several environment variables to be set up for various services (Supabase, Google AI, Google Cloud).

### Local Development

For local development, create a `.env` file in the root of the `apps/dfda-node` project (or the monorepo root if configured that way). It should contain at least:

```env
# Supabase (Get from your Supabase project settings)
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

# Google Generative AI (For direct Gemini API calls, e.g., AI generation script)
# Get from Google AI Studio: https://aistudio.google.com/app/apikey
GOOGLE_GENERATIVE_AI_API_KEY=YOUR_GEMINI_API_KEY

# Google Cloud (For Vertex AI Search / Grounded Search)
GOOGLE_CLOUD_PROJECT_ID=YOUR_GCP_PROJECT_ID
# GOOGLE_APPLICATION_CREDENTIALS= # Optional: Path to service account key if *not* using ADC

# Optional: Other variables like Google OAuth Client ID/Secret if needed
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=

# Optional: Database connection string if needed directly by ORM/scripts
# DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-SUPABASE-ID].supabase.co:5432/postgres"
```

**Authentication for Google Cloud Locally (Recommended):**

1.  Install the `gcloud` CLI: [https://cloud.google.com/sdk/docs/install](https://cloud.google.com/sdk/docs/install)
2.  Log in with your Google account: `gcloud auth login`
3.  Set up Application Default Credentials (ADC): `gcloud auth application-default login`
    This allows the Google Cloud client libraries to automatically find your credentials when running locally.

### Vercel Deployment

1.  Go to your Vercel Project Settings > Environment Variables.
2.  Add all required variables from your `.env` file (e.g., `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY`, `GOOGLE_CLOUD_PROJECT_ID`).
3.  **Google Cloud Service Account Key:**
    *   Follow the steps in the "Google Cloud Setup for Vertex AI Search" section below to create a service account and download its JSON key file.
    *   Add the `GOOGLE_APPLICATION_CREDENTIALS` variable in Vercel.
    *   **Paste the entire content** of the downloaded JSON key file as the value for `GOOGLE_APPLICATION_CREDENTIALS`.
    *   Ensure variables are set for the correct environments (Production, Preview, Development).

### Google Cloud Setup for Vertex AI Search (Grounded Search Feature)

To use the AI Generated Summary feature powered by Vertex AI Search (grounded on Google Search), you need to configure Google Cloud credentials.

**Using Google Cloud Shell or Local `gcloud` CLI:**

1.  **Set Project and Variables:**
    ```bash
    # Replace YOUR_PROJECT_ID with your actual GCP project ID
    export PROJECT_ID="healome-dev-358414"
    export SERVICE_ACCOUNT_NAME="dfda-node-search-user" # Choose a name
    export SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
    export KEY_FILE_PATH="./${SERVICE_ACCOUNT_NAME}-key.json"

    # Set the active project for gcloud commands
    gcloud config set project ${PROJECT_ID}
    ```

2.  **Enable APIs:**
    ```bash
    gcloud services enable discoveryengine.googleapis.com --project=${PROJECT_ID}
    ```

3.  **Create Service Account:**
    ```bash
    gcloud iam service-accounts create ${SERVICE_ACCOUNT_NAME} \
        --display-name="DFDA Node Vertex AI Search User" \
        --project=${PROJECT_ID}
    ```

4.  **Grant IAM Role:**
    ```bash
    # roles/discoveryengine.user includes discoveryengine.conversations.converse
    gcloud projects add-iam-policy-binding ${PROJECT_ID} \
        --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
        --role="roles/discoveryengine.user"
    ```

5.  **Create and Download Key:**
    ```bash
    gcloud iam service-accounts keys create ${KEY_FILE_PATH} \
        --iam-account=${SERVICE_ACCOUNT_EMAIL} \
        --project=${PROJECT_ID}
    echo "Service Account key saved to ${KEY_FILE_PATH}"
    echo "IMPORTANT: Secure this key file and do NOT commit it!"
    ```

6.  **Configure Vercel:** Add `GOOGLE_CLOUD_PROJECT_ID` and `GOOGLE_APPLICATION_CREDENTIALS` (pasting the JSON key content) to your Vercel Environment Variables as described in the "Vercel Deployment" section above.

## 2. Overall Architecture

The ecosystem consists of several key components within a monorepo (plus external marketing site if desired later):

```mermaid
graph TD
    subgraph dFDA Ecosystem Monorepo
        direction LR

        subgraph Central Services & Management Apps/Backends
            direction TB
            NetworkManagerApp[network-manager App\n(Internal Admin UI)]
            DFDAConnectApp[dfda-connect App\n(Central Importer Service)]
            subgraph Shared Backend Services
                direction TB
                DFDADataService[dFDA Data Aggregation\n& Insights Service]
                AIAgentService[AI Agent Marketplace Service]
                AIDoctorService[AI Doctor Service\n(Module Backend)]
            end

            NetworkManagerApp -->|Manages Rules/Nodes| DFDADataService
            NetworkManagerApp -->|Manages Central Config| DFDAConnectApp
        end

        subgraph "White-Labeled Instances (dfda-node App Template)"
            direction TB
            Instance1[Instance A\n(Deployed dfda-node)]
            Instance2[Instance B\n(Deployed dfda-node)]
            Instance3[...]

            subgraph Instance A Modules
                A_Patient[Patient Portal]
                A_Provider[Provider Portal]
                A_Admin[Admin Portal]
                A_AI_Market[AI Marketplace UI]
                A_Dev[Developer API]
            end
            Instance1 --- A_Patient & A_Provider & A_Admin & A_AI_Market & A_Dev

            subgraph Instance B Modules
                B_Patient[Patient Portal]
                B_Provider[Provider Portal]
                B_Admin[Admin Portal]
                B_AI_Market[AI Marketplace UI]
                B_Dev[Developer API]
            end
            Instance2 --- B_Patient & B_Provider & B_Admin & B_AI_Market & B_Dev
        end

        ExternalSystems[External Systems\n(EHRs, Fitbit, Apple Health, etc.)]

        %% Interactions
        %% Instance <-> Central Service Interactions
        Instance1 -->|Contributes Anonymized Data (Opt-in)| DFDADataService
        Instance2 -->|Contributes Anonymized Data (Opt-in)| DFDADataService
        DFDADataService -->|Provides Aggregated Insights (Premium Module)| Instance1
        DFDADataService -->|Provides Aggregated Insights (Premium Module)| Instance2

        Instance1 -->|Uses Agents / Reports Usage| AIAgentService
        Instance2 -->|Uses Agents / Reports Usage| AIAgentService

        Instance1 -->|Calls AI Doctor API (If Module Active)| AIDoctorService
        Instance2 -->|Calls AI Doctor API (If Module Active)| AIDoctorService

        %% Instance <-> dfda-connect Interactions
        Instance1 -->|Redirects Patient for OAuth| DFDAConnectApp
        Instance2 -->|Redirects Patient for OAuth| DFDAConnectApp
        DFDAConnectApp -->|Pushes Fetched Data via API| Instance1
        DFDAConnectApp -->|Pushes Fetched Data via API| Instance2

        %% Instance <-> External Interactions
        Instance1 -->|Integrates Via Admin API Keys| ExternalSystems
        Instance2 -->|Integrates Via Admin API Keys| ExternalSystems
        DFDAConnectApp -->|Connects via Central OAuth| ExternalSystems

    end

    style "Central Services & Management Apps/Backends" fill:#f9f,stroke:#333,stroke-width:2px
    style "White-Labeled Instances (dfda-node App Template)" fill:#ccf,stroke:#333,stroke-width:2px
```

*   **`dfda-node` App:** The white-labeled SaaS product template deployed for each customer. Contains instance-specific PHI and configuration. Resides in `apps/dfda-node`.
*   **`network-manager` App:** Separate internal application to manage the overall dFDA network, register nodes, set global rules. Resides in `apps/network-manager`.
*   **`dfda-connect` App:** Central service handling third-party data imports via central OAuth credentials (MVP). Securely stores third-party tokens centrally and pushes fetched data to the appropriate `dfda-node` instance API. Resides in `apps/dfda-connect`. (Future: Option for dedicated `dfda-connect` deployments per customer).
*   **Central Backend Services:** Likely implemented as backend logic/APIs potentially shared or managed alongside the above apps.
    *   `dFDA Data Aggregation & Insights Service`: Handles anonymized data and network insights.
    *   `AI Agent Marketplace Service`: Manages AI agents and usage.
    *   `AI Doctor Service`: Backend for the AI Doctor module.
*   **Marketing Site:** Public marketing/sales website (e.g., `dfda.earth`). Included in `apps/marketing-site` for initial convenience, can be extracted later.

## 3. Data Architecture

*   **Instance Database (Per `dfda-node` Instance):**
    *   Stores all identifiable data for that instance: Users (Admin, Provider, Patient), instance config, trial data, **detailed Patient PHI (logs, imports pushed from `dfda-connect`, ratings)**, e-commerce data (if module active), consents.
    *   **PHI remains strictly isolated within the instance database.**
*   **`dfda-connect` Database (Central Service):**
    *   Stores third-party access tokens (securely encrypted) mapped to user + instance identifiers.
    *   May temporarily cache fetched data during processing before pushing to the instance DB, but should minimize/eliminate long-term central storage of raw PHI.
*   **Global dFDA Database (Central Service):**
    *   Stores only **anonymized, aggregated** data contributed by consenting instances.
    *   Includes statistical trends, anonymized trial outcomes, anonymized treatment source/batch info (for traceability), global trial registry, network node metadata.
    *   **No PII/PHI.**
*   **Data Flow:**
    *   **Instance (`dfda-node`) -> Central:** One-way push of anonymized, aggregated data batches via secure API to `dFDA Data Service` (requires consent, uses server-to-server auth).
    *   **Central -> Instance (`dfda-node`):** Instances make API calls to retrieve aggregated insights, use AI agents, or access the AI Doctor service.
    *   **Third-Party -> `dfda-connect` -> Instance (`dfda-node`):** `dfda-connect` fetches data using centrally stored tokens and pushes it via secure API to the correct instance database.

## 4. Authentication Overview

*   **User Authentication (Within `dfda-node` Instance):** Standard OAuth2 / OpenID Connect for Admin, Provider, Patient logins.
*   **External App Connections (Patient):** Patient redirects from `dfda-node` to central `dfda-connect` service which handles OAuth2 with third parties (Fitbit, etc.). `dfda-connect` stores tokens centrally.
*   **Instance <-> Central Service Communication:** Server-to-server authentication (API Keys/Secrets or mTLS) used for:
    *   `dfda-node` pushing anonymized data to `dFDA Data Service`.
    *   `dfda-node` calling `AI Agent Service`, `AI Doctor Service`, `dFDA Data Service` (for insights).
    *   `dfda-connect` pushing fetched data *into* the `dfda-node` instance's API.
*   **Organizational Integrations:** Admin-managed API Keys used for `dfda-node` instance integrations with external org systems (EHRs, etc.).

## 5. Component: `dfda-node` (White-Labeled Instance Platform)

This is the core application template described by the sitemap below.

*   **Target Customers:** Pharma companies, research institutions, CROs, hospitals, clinics, longevity clinics, non-profits.
*   **Core Features:** Trial creation & management, provider tools for patient oversight within trials, comprehensive patient health logging & data import (via `dfda-connect`), AI agent integration, instance administration & customization (branding, content, UI), connection to dFDA network (data contribution, optional insight retrieval).
*   **Optional Modules:** E-commerce (with traceability focus), AI Doctor, Cross-Network Comparative Insights.

### 5.1. Detailed Sitemap (`dfda-node` Instance)

```markdown
# dfda-node Sitemap (White-Labeled Instance)

## Public Content (No Auth Required)
- [x] `/(public)/` - Homepage and general content
  - [x] `/` - Home page (Instance specific branding/content) (Score: 10)
  - [ ] `/about` - About this platform instance & connection to dFDA Network (Score: 5)
  - [x] `/impact` - Platform impact statistics (Instance specific, if applicable) (Score: 3)
  - [x] `/contact` - Contact instance administrator/support (Score: 6)
  - [x] `/terms` - Terms of service (Instance specific) (Score: 10)
  - [x] `/privacy` - Privacy policy (Instance specific) (Score: 10)
  - [x] `/find-trials` - (Optional: Public view of trials hosted on this instance, if enabled by admin) (Score: 5)
  - [ ] `/ai-doctor-info` - Information about the AI Doctor service (Add-on Module) (Score: 4)
  - [ ] `/network-insights-info` - Information about Cross-Network Comparative Insights (Add-on Module) (Score: 4)

## Authentication
- [x] `/(auth)/` - Authentication related pages
  - [x] `/login` - Login page (for Admins, Providers, Patients) (Score: 10)
  - [x] `/register` - Patient registration / Trial Enrollment Portal (Score: 10)
  - [x] `/forgot-password` - Password recovery (Score: 6)
  - [ ] `/reset-password` - Password reset (Score: 6)

## Patient Features (Auth Required)
  - [x] `/patient/` - Personalized overview, alerts, insights summary (Score: 8)
  - [ ] `/patient/log` - Central logging hub (Score: 9)
    - [ ] `/patient/log/treatment` - Log medications, therapies, etc. (Link to purchased item if applicable) (Score: 9)
    - [ ] `/patient/log/symptom` - Log symptoms, severity, duration (Score: 9)
    - [ ] `/patient/log/food` - Log meals, snacks, hydration (Score: 7)
    - [ ] `/patient/log/activity` - Log physical activity (Score: 7)
    - [ ] `/patient/log/condition-event` - Log specific events related to conditions (Score: 8)
    - [ ] `/patient/log/vitals` - Log vital signs (manual or imported) (Score: 8)
  - [ ] `/patient/data/import` - Initiate connection to apps & devices (Redirects to `dfda-connect`) (Score: 8)
  - [ ] `/patient/data/summary` - View own comprehensive health data history (Score: 8)
  - [ ] `/patient/data/export` - Export own health data (Score: 6)
  - [ ] `/patient/insights` - Personalized analytics & potential causal inferences (*requires careful presentation & disclaimers*) (Score: 8)
  - [ ] `/patient/effectiveness` - View personalized effectiveness ratings for logged treatments/interventions (Score: 7)
  - [ ] `/patient/rate` - Rate treatments & side effects (Score: 7)
    - [ ] `/patient/rate/treatment/[id]` (Score: 7)
    - [ ] `/patient/rate/side-effect/[id]` (Score: 7)
  - [ ] `/patient/explore` - Explore anonymized, aggregated data trends from the dFDA network (*requires strict privacy controls & admin enablement*) (Score: 6)
  - [ ] `/patient/ai-doctor` - AI Doctor interaction hub (Requires AI Doctor Module Activation) (Score: 9)
    - [ ] `/patient/ai-doctor/chat` (Score: 9)
    - [ ] `/patient/ai-doctor/voice` (Score: 9)
    - [ ] `/patient/ai-doctor/history` - View past sessions (Score: 7)
    - [ ] `/patient/ai-doctor/share` - Initiate session sharing with human provider (Score: 8)
  - [ ] `/patient/trials` - View enrolled trials (if applicable) (Score: 8)
    - [ ] `/patient/trials/[id]/details` - View specific trial details & documents (Score: 7)
    - [ ] `/patient/trials/[id]/schedule` - View appointments & task schedule (Score: 7)
    - [ ] `/patient/trials/[id]/data-submission` - Submit ePROs for specific trials (Score: 10)
  - [ ] `/patient/goals` - Set and track personal health goals (Score: 5)
  - [ ] `/patient/learn` - Access educational resources related to conditions/treatments (Score: 4)
  - [ ] `/patient/community` - (Optional) Connect with other patients (if enabled by admin) (Score: 3)
  - [ ] `/patient/store/browse` - Browse available treatments/tests (if E-commerce module active) (Score: 7)
  - [ ] `/patient/store/product/[id]` - View product details & source info (Score: 7)
  - [ ] `/patient/store/cart` - Shopping cart (Score: 7)
  - [ ] `/patient/store/checkout` - Checkout process (Score: 8)
  - [ ] `/patient/store/orders` - View order history (linked to logged treatments) (Score: 8)


## Provider Features (Auth Required)
  - [x] `/provider/` - Provider-specific dashboard view (Score: 8)
  - [ ] `/provider/trials` - View assigned trials (Score: 8)
  - [ ] `/provider/trials/[id]/patients` - Manage patients enrolled in a specific trial (Score: 9)
  - [ ] `/provider/patients/[id]/profile` - View patient profile overview (Score: 7)
  - [ ] `/provider/patients/[id]/health-log` - View patient's comprehensive log (Score: 8)
  - [ ] `/provider/patients/[id]/insights` - View patient's generated insights (Score: 7)
  - [ ] `/provider/patients/[id]/data` - View/Manage specific patient data for a trial (Score: 9)
  - [ ] `/provider/patients/[id]/schedule` - Manage patient schedule/appointments (Score: 7)
  - [ ] `/provider/patients/[id]/communication` - (Optional) Secure messaging with patients (Score: 6)
  - [ ] `/provider/patients/[id]/ai-doctor-sessions` - View shared AI Doctor sessions (Score: 8)
  - [ ] `/provider/schedule` - View own schedule (Score: 6)
  - [ ] `/provider/ai-consultation` - (Requires AI Doctor Module Activation) Interface for provider to use AI Doctor (Score: 9)

## AI Agent Marketplace (Integrated Feature - Usage Metered)
  - [ ] `/ai/marketplace` - Browse available AI agents (for trial optimization, analysis, patient engagement, etc.) (Score: 9)
  - [ ] `/ai/my-agents` - Manage subscribed AI agents & view usage (Score: 8)

## Developer Portal (API Access for Integration - Usage Metered?)
- [x] `/(developer)/`
  - [x] `/developers` - Developer home/overview (Score: 5)
  - [ ] `/developers/documentation` - API documentation (Score: 6)
  - [ ] `/developers/api-keys` - Manage API keys for instance integration (Score: 7)

## Admin Features (Instance Configuration & Management)
  - [x] `/admin/` - Overview of instance activity, usage metrics, billing status (Score: 8)
  - [ ] `/admin/users` - Manage Provider & Patient accounts (Seat/Patient limits based on subscription) (Score: 9)
  - [ ] `/admin/roles` - Manage user roles and permissions within the instance (Score: 8)
  - [ ] `/admin/trials` - Create & Oversee trials run on this instance (Active trial limits based on subscription/usage) (Score: 10)
  - [ ] `/admin/billing` - Manage subscription, view usage & billing history, payment methods (Score: 10)
  - [ ] `/admin/analytics` - Standard trial analytics & reporting (Includes Network Insights if module activated) (Score: 8)
  - [ ] `/admin/recruitment-tools` - Configure patient recruitment tools/integrations (Score: 7)
  - [ ] `/admin/budget-tracking` - Track trial budgets (Score: 7)
  - [ ] `/admin/content` - Configure instance-specific content (e.g., help text, FAQs, patient materials, public pages) (Score: 7)
  - [ ] `/admin/branding` - Configure instance logo, colors, domain name (Score: 8)
  - [ ] `/admin/ui-settings` - Configure UI elements/layout options, navigation (Score: 7)
  - [ ] `/admin/module-management` - Activate/manage add-on modules (AI Doctor, Network Insights, E-commerce) & AI Agent subscriptions (Score: 10)
  - [ ] `/admin/store/products` - Manage catalog of treatments/tests & source/batch info (if E-commerce module active) (Score: 8)
  - [ ] `/admin/store/orders` - View and manage orders (if E-commerce module active) (Score: 8)
  - [ ] `/admin/store/settings` - Configure store settings, fulfillment options (if E-commerce module active) (Score: 7)
  - [ ] `/admin/settings/general` - Basic instance settings (Score: 6)
  - [ ] `/admin/settings/network` - Configure connection to dFDA network & data contribution rules (Score: 8)
  - [ ] `/admin/settings/integrations` - Configure integrations (EHR, external apps, etc.) (Score: 7)
  - [ ] `/admin/settings/compliance` - Manage consent forms, data privacy settings, audit logs (Score: 10)
  - [ ] `/admin/settings/usage-monitoring` - View detailed usage metrics (AI, storage, API calls, etc.) (Score: 8)
```

### 5.2. High-Level User Stories (Instance Roles)

*   **Patient:**
    *   As a patient, I want to easily log my treatments, symptoms, and other health data so I can track my progress.
    *   As a patient, I want to connect my health apps and devices so my data is centralized.
    *   As a patient, I want to see personalized insights about what might be affecting my health based on my data.
    *   As a patient, I want to rate the effectiveness and side effects of my treatments to contribute to collective knowledge.
    *   As a patient, I want to interact with an AI Doctor for health advice and share sessions with my human provider.
    *   As a patient participating in a trial, I want to easily submit required data and view my schedule.
    *   As a patient, I want to order treatments/tests through the platform and have their source tracked.
*   **Provider:**
    *   As a provider, I want to view a comprehensive health picture of my patients enrolled in trials.
    *   As a provider, I want to monitor patient adherence and data submissions for trials.
    *   As a provider, I want to use AI tools (like the AI Doctor consultation interface) to assist in patient care within trials.
    *   As a provider, I want to manage trial schedules and communicate securely with my patients.
*   **Admin (Instance):**
    *   As an admin, I want to configure the platform's branding, content, and UI to match my organization.
    *   As an admin, I want to create and manage clinical trials conducted by my organization.
    *   As an admin, I want to manage user accounts (providers, patients) and their permissions.
    *   As an admin, I want to monitor trial progress, analytics, and budget.
    *   As an admin, I want to manage the instance's subscription, billing, and usage.
    *   As an admin, I want to activate and configure optional modules (E-commerce, AI Doctor, Network Insights).
    *   As an admin, I want to configure the instance's connection and data contribution settings for the dFDA network.
    *   As an admin, I want to manage the e-commerce catalog and settings (if module active).

## 6. Component: dFDA Network Management App

*   **Purpose:** Central administration of the entire dFDA network. Not user-facing for instance customers.
*   **Features:** Node (instance) registration/approval, network health monitoring, global rule setting (e.g., data schemas, contribution policies), managing central services access, potentially network-wide governance mechanisms.

## 7. Component: Central Services

*   **dFDA Data Aggregation & Insights Service:** Securely ingests anonymized data, performs aggregation, generates network-level insights (offered via API to instances with the module).
*   **AI Agent Marketplace Service:** Hosts, manages, executes AI agents. Provides APIs for instances to browse, subscribe, and run agents (usage metered).
*   **AI Doctor Service:** The backend engine for AI consultations. Provides APIs for instances (with the module) to initiate and manage sessions.

## 8. Revenue Model (Hybrid Usage-Based)

*   **Core Subscription:** Tiered monthly/annual fee per instance based on baseline limits (e.g., # Admin/Provider seats, # active trials, baseline data storage). Provides access to the core platform and features.
    *   *Estimate:* Tier 1: $2k/mo, Tier 2: $5k/mo, Tier 3: $10k+/mo (Requires market validation)
*   **Metered Usage:** Charges for consumption beyond baseline limits or for specific resource-intensive actions.
    *   AI Agent Usage (per call/compute unit): *Estimate:* $0.01 - $1.00 per execution depending on complexity.
    *   Data Storage (per GB over baseline): *Estimate:* $0.10/GB/month.
    *   API Calls (per 1000 calls over baseline): *Estimate:* $0.50.
*   **Optional Add-on Modules (Subscription):**
    *   AI Doctor Module: *Estimate:* Additional $1k-$5k/mo per instance, or $50-$200/mo per provider seat using it.
    *   Cross-Network Insights Module: *Estimate:* Additional $1k-$3k/mo per instance.
    *   E-commerce Module: *Estimate:* Additional $500-$1500/mo per instance + potential transaction fee (e.g., 1-3%).
*   **(Who Pays Who):** Organizations (Pharma, Clinics etc.) pay the platform provider (you) for the instance subscription, usage overages, and optional modules. Patients generally do not pay directly, unless a specific premium patient-facing feature is offered directly (less likely in B2B model).

## 9. Initial Roadmap & High-Level TODOs

*   **Phase 1: Core Platform MVP & Instance Deployment**
    *   [x] Refine database schema for instance data (Users, Trials, Basic Patient Logging)
    *   [x] Build core authentication (Admin, Provider, Patient)
    *   [ ] Implement core Admin features (User Mgmt, Trial Creation/Mgmt, Basic Settings)
    *   [ ] Implement core Provider features (View Trials, Manage Patients in Trial, Basic Data View)
    *   [ ] Implement core Patient features (Basic Logging, View Trial Info, Basic Data Submission)
    *   [ ] Setup basic white-labeling capability (branding config)
    *   [ ] Develop instance (`dfda-node`) deployment mechanism (manual or semi-automated initially)
    *   [ ] Setup basic subscription billing integration (e.g., Stripe)
*   **Phase 2: Central Services & Network Foundation MVP**
    *   [ ] Build MVP `dfda-connect` central service (secure token storage, data fetch/push logic, initial third-party integrations).
    *   [ ] Design secure anonymization & aggregation process for `dFDA Data Service`.
    *   [ ] Build MVP `dFDA Data Aggregation Service` (receive & store anonymized data).
    *   [ ] Build MVP `network-manager` App (basic node registration).
    *   [ ] Implement instance (`dfda-node`) connection & data contribution mechanism (`/admin/settings/network`).
    *   [ ] Define and implement secure API on `dfda-node` for `dfda-connect` to push data.
*   **Phase 3: AI Integration & Monetization Expansion**
    *   [ ] Build `AI Agent Marketplace Service` backend & integrate with `dfda-node`.
    *   [ ] Integrate AI Agent Marketplace UI in `dfda-node` (`/ai/marketplace`, `/ai/my-agents`).
    *   [ ] Implement usage metering infrastructure
    *   [ ] Integrate metered billing with subscription platform
    *   [ ] Develop initial set of valuable AI Agents
*   **Phase 4: Advanced Features & Modules**
    *   [ ] Develop `AI Doctor Service` backend & integration module
    *   [ ] Develop `Cross-Network Insights` module & backend processing
    *   [ ] Develop `E-commerce` module (with traceability focus)
    *   [ ] Implement advanced patient features (Insights, Effectiveness, Exploration)
    *   [ ] Enhance Developer Portal & API capabilities (including Admin-managed keys)
    *   [ ] **Implement Patient-Facing API (FHIR/OAuth/SMART on FHIR):** Crucial for Cures Act compliance, allowing patients to authorize third-party apps to access their data from `dfda-node`. (High priority post-MVP).
    *   [ ] **Offer Dedicated `dfda-connect` Deployments:** Build automation to deploy single-tenant importer instances for enterprise customers. (Post-MVP).
*   **Ongoing:** Security audits (especially for `dfda-connect`), compliance adherence (HIPAA/GDPR/Cures Act), performance optimization, user feedback incorporation, scaling infrastructure.
