---
title: "💊 OBJECTIVE: MAXIMUM CURE ACCELERATION 🚀"
description: We are a borg-like entity devoted to minimizing suffering by any and all means necessary.
---

> **dFDA (Decentralized Framework for Drug Assessment)** is open-source software for ranking treatments by real-world outcomes and publishing an Outcome Label for each one. It is designed so patient records stay with patients and clinics and only aggregate results are shared; that sharing isn't built yet (see What works today below). It is an independent open-source project, not affiliated with, endorsed by, or acting on behalf of the U.S. Food and Drug Administration.

```mermaid
flowchart LR
  SAFE["Digital Twin Safe<br/>(patient's own data)"] -- "OAuth: share with my doctor" --> NODE["Clinic Node<br/>(runs at the clinic)"]
  NODE -- "Summary File<br/>(aggregates only)" --> AGG["Global Aggregator"]
  AGG --> SITE["dfda.earth<br/>Treatment Rankings + Outcome Labels"]
```

**What works today**

| Piece | Status | Where |
| --- | --- | --- |
| Clinic Node prototype | Prototype: patient condition and treatment tracking, 0–10 treatment ratings, outcome-label schema. No federation yet. | [`apps/dfda-node`](apps/dfda-node) |
| N-of-1 causal analysis engine | Working TypeScript library | [`optimitron/packages/optimizer`](https://github.com/mikepsinn/optimitron/tree/main/packages/optimizer) |
| Patient ratings | Live for 162 conditions and ~3,900 treatments, reported by patients | [crowdsourcingcures.org/conditions](https://www.crowdsourcingcures.org/conditions) |
| Automated N-of-1 studies | ~15,800 legacy observational analyses, not peer reviewed | [studies.crowdsourcingcures.org](https://studies.crowdsourcingcures.org) |
| Summary File spec, Codebook, Global Aggregator | Designed, not built yet | — |

The plan for bringing code and data from the related projects into this repo is in [docs/MIGRATION.md](docs/MIGRATION.md). The full vision follows.

# 💖 OBJECTIVE: MAXIMUM CURE ACCELERATION

Billions of people are suffering needlessly because the current system of clinical research, diagnosis, and treatment sucks because:

* ⏳ **Counterproductive Regulatory Barriers** to clinical research block life-saving treatments by 7-12 years
* 🚫 **97% of patients** are excluded from clinical trials
* 💰 **Drug development costs** of $2.6B are passed on to patients
* ⏱️ **Terminal patients** wait 4+ years for breakthrough therapy approvals
* 📊 The system ignores **real-world evidence** about effective treatments

## 💡 The Solution

The Cure Acceleration Act creates:

* ✅ **Universal Trial Access** - Every person's right to try safe treatments
* 🤖 **dFDA (Decentralized Framework for Drug Assessment)** - Free, open infrastructure for real-world evidence collection
* 🏆 **50/50 Health Savings Sharing Rewards** - Multi-billion dollar incentives for developing actual cures instead of lifetime drug subscriptions
* 📈 **Real-Time Analysis** of the positive and negative effects of every food, supplement, drug, and treatment on every measurable aspect of human health and happiness
* 🌐 **Global Access** - Decentralized trials anyone can participate in from home

[👉 Read the Full Cure Acceleration Act](apps/crowdsourcing-cures/public/docs/cure-acceleration-act.md)

# 😕 Why are we doing this?

The current system of clinical research, diagnosis, and treatment is failing the billions of people are suffering from chronic diseases.

[👉 Problems we're trying to fix...](apps/crowdsourcing-cures/public/docs/stuff-that-sucks.md)

# 🧪 Our Hypothesis

By harnessing global collective intelligence and oceans of real-world data, we hope to emulate Wikipedia's speed of knowledge generation.

<!--suppress CheckImageSize, HtmlDeprecatedAttribute -->
<details>
  <summary>👉 How to generate discoveries 50X faster and 1000X cheaper than current systems...</summary>

## Global Scale Clinical Research + Collective Intelligence = 🤯

So in the 90's, Microsoft spent billions hiring thousands of PhDs to create Encarta, the greatest encyclopedia in history.  A decade later, when Wikipedia was created, the general consensus was that it was going to be a dumpster fire of lies.  Surprisingly, Wikipedia ended up generating information 50X faster than Encarta and was about 1000X cheaper without any loss in accuracy.  This is the magical power of crowdsourcing and open collaboration.

Our crazy theory is that we can accomplish the same great feat in the realm of clinical research.  By crowdsourcing real-world data and observations from patients, clinicians, and researchers, we hope to generate clinical discoveries 50X faster and 1000X cheaper than current systems.

## The Potential of Real-World Evidence-Based Studies

- **Diagnostics** - Data mining and analysis to identify causes of illness
- **Preventative medicine** - Predictive analytics and data analysis of genetic, lifestyle, and social circumstances
  to prevent disease
- **Precision medicine** - Leveraging aggregate data to drive hyper-personalized care
- **Medical research** - Data-driven medical and pharmacological research to cure disease and discover new treatments and medicines
- **Reduction of adverse medication events** - Harnessing of big data to spot medication errors and flag potential
  adverse reactions
- **Cost reduction** - Identification of value that drives better patient outcomes for long-term savings
- **Population health** - Monitor big data to identify disease trends and health strategies based on demographics,
  geography, and socioeconomic

</details>

# 🖥️  Framework Components

This is a very high-level overview of the architecture. The three primary primitive components of the framework are:

1. [Data Silo API Gateway Nodes](#1-data-silo-api-gateway-nodes) that facilitate data export from data silos
2. [Digital Twin Safes](#2-digital-twin-safes) that import, store, and analyze your data to identify how various factors affect your health
3. [Clinipedia](#3-clinipediathe-wikipedia-of-clinical-research) that contains the aggregate of all available data on the effects of every food, drug, supplement, and medical intervention on human health.

![framework-diagram.png](https://static.crowdsourcingcures.org/img/dfda-framework-diagram.png)

## 1. Data Silo API Gateway Nodes

![dfda-gateway-api-node-silo.jpg](https://static.crowdsourcingcures.org/dfda/components/data-silo-gateway-api-nodes/dfda-gateway-api-node-silo.png)


[Gateway API Nodes](apps/crowdsourcing-cures/public/docs/components/data-silo-gateway-api-nodes) should make it easy for data silos, such as hospitals and digital health apps, to let people export and save their data locally in their [Digital Twin Safes](#2-digital-twin-safes).

**👉 [Learn More About Gateway APIs](apps/crowdsourcing-cures/public/docs/components/data-silo-gateway-api-nodes/data-silo-api-gateways.md)**

## 2. Digital Twin Safes

[Digital Twin Safes](apps/crowdsourcing-cures/public/docs/components/personal-fda-nodes/personal-fda-nodes.md) are applications that can run on your phone or computer. They import, store, and analyze your data to identify how various factors affect your health.  They can also be used to share anonymous analytical results with the [Clinipedia FDAi Wiki](#3-clinipediathe-wikipedia-of-clinical-research) in a secure and privacy-preserving manner.

Each [Digital Twin Safe](apps/crowdsourcing-cures/public/docs/components/personal-fda-nodes/personal-fda-nodes.md) combines [encrypted local storage](apps/crowdsourcing-cures/public/docs/components/digital-twin-safe/digital-twin-safe.md) with a [personal AI agent](apps/crowdsourcing-cures/public/docs/components/optimiton-ai-agent/optomitron-ai-agent.md) that applies causal inference algorithms to estimate how various factors affect your health.

### 2.1. Digital Twin Safes

![digital-twin-safe-no-text.jpg](https://static.crowdsourcingcures.org/dfda/components/digital-twin-safe/digital-twin-safe-no-text.png)

A local application for self-sovereign import and storage of personal data.

**👉[Learn More or Contribute to Digital Twin Safe](apps/crowdsourcing-cures/public/docs/components/digital-twin-safe/digital-twin-safe.md)**

### 2.2. Personal AI Agents

[Personal AI agents](apps/crowdsourcing-cures/public/docs/components/optimiton-ai-agent/optomitron-ai-agent.md) that live in your [Digital Twin Safe](apps/crowdsourcing-cures/public/docs/components/personal-fda-nodes/personal-fda-nodes.md) and use [causal inference](apps/crowdsourcing-cures/public/docs/components/optimiton-ai-agent/optomitron-ai-agent.md) to estimate how various factors affect your health.

![data-import-and-analysis.gif](https://static.crowdsourcingcures.org/img/data-import-and-analysis.gif)



**👉[Learn More](apps/crowdsourcing-cures/public/docs/components/optimiton-ai-agent/optomitron-ai-agent.md)**


## 3. Clinipedia—The Wikipedia of Clinical Research

![clinipedia_globe_circle.jpg](https://static.crowdsourcingcures.org/dfda/components/clinipedia/clinipedia_globe_circle.png)


The [Clinipedia wiki](apps/crowdsourcing-cures/public/docs/components/clinipedia/clinipedia.md) should be a global knowledge repository containing the aggregate of all available data on the effects of every food, drug, supplement, and medical intervention on human health.

**[👉 Learn More or Contribute to the Clinipedia](apps/crowdsourcing-cures/public/docs/components/clinipedia/clinipedia.md)**

### 3.1 Outcome Labels

A key component of Clinipedia is [**Outcome Labels**](apps/crowdsourcing-cures/public/docs/components/outcome-labels/outcome-labels.md) that list the degree to which the product is likely to improve or worsen specific health outcomes or symptoms.

![outcome-labels.png](https://static.crowdsourcingcures.org/dfda/components/outcome-labels/outcome-labels.png)

**👉 [Learn More About Outcome Labels](apps/crowdsourcing-cures/public/docs/components/outcome-labels/outcome-labels.md)**


### Features


* [Data Collection](apps/crowdsourcing-cures/public/docs/components/data-collection/data-collection.md)
* [Data Import](apps/crowdsourcing-cures/public/docs/components/data-import/data-import.md)
* [Data Analysis](#data-analysis)
    * [🏷️Outcome Labels](#-outcome-labels)
    * [🔮Predictor Search Engine](apps/crowdsourcing-cures/public/docs/components/predictor-search-engine/predictor-search-engine.md)
    * [🥕 Root Cause Analysis Reports](apps/crowdsourcing-cures/public/docs/components/root-cause-analysis-reports/root-cause-analysis-reports.md)
    * [📜Observational Mega-Studies](apps/crowdsourcing-cures/public/docs/components/observational-studies/observational-studies.md)
* [Real-Time Decision Support Notifications](apps/crowdsourcing-cures/public/docs/components/decision-support-notifications)
* [No Code Health App Builder](apps/crowdsourcing-cures/public/docs/components/no-code-app-builder)
* [Personal AI Agent](apps/crowdsourcing-cures/public/docs/components/optimiton-ai-agent/optomitron-ai-agent.md)
* [Browser Extension](apps/crowdsourcing-cures/public/docs/components/browser-extension)

<p align="center">

<img src="https://static.crowdsourcingcures.org/img/screenshots/record-inbox-import-connectors-analyze-study.png" width="800" alt="screenshots">
&nbsp
</p>
<p align="center">
  <img src="https://static.crowdsourcingcures.org/img/screenshots/reminder-inbox-screenshot-no-text.png" width="300" alt="Reminder Inbox">
</p>

Collects and aggregate data on symptoms, diet, sleep, exercise, weather, medication, and anything else from dozens
of life-tracking apps and devices. Analyzes data to reveal hidden factors exacerbating or improving symptoms of
chronic illness.

### Web Notifications

Web and mobile push notifications with action buttons.

![web notification action buttons](https://static.crowdsourcingcures.org/dfda/components/data-collection/web-notification-action-buttons.png)

### Browser Extensions

By using the Browser Extension, you can track your mood, symptoms, or any outcome you want to optimize in a fraction of a second using a unique popup interface.

![Chrome Extension](https://static.crowdsourcingcures.org/dfda/components/browser-extension/browser-extension.png)

### Data Analysis

The Analytics Engine performs temporal precedence accounting, longitudinal data aggregation, erroneous data filtering, unit conversions, ingredient tagging, and variable grouping to quantify correlations between symptoms, treatments, and other factors.

It then pairs every combination of variables and identifies likely causal relationships using correlation mining algorithms in conjunction with a pharmacokinetic model.  The algorithms first identify the onset delay and duration of action for each hypothetical factor. It then identifies the optimal daily values for each factor.

[👉 More info about data analysis](apps/crowdsourcing-cures/public/docs/components/data-analysis/data-analysis.md)


### Real-time Decision Support Notifications

![](apps/crowdsourcing-cures/public/docs/components/decision-support-notifications/notifications-screenshot-slide.png)

[More info about real time decision support](apps/crowdsourcing-cures/public/docs/components/outcome-labels/outcome-labels.md)

### 📈 Predictor Search Engine

[![Predictor Search Engine](apps/crowdsourcing-cures/public/docs/components/predictor-search-engine/predictor-search-simple-list-zoom.png)](apps/crowdsourcing-cures/public/docs/components/predictor-search-engine/predictor-search-engine.md)

[👉 More info about the predictor search engine...](apps/crowdsourcing-cures/public/docs/components/predictor-search-engine/predictor-search-engine.md)

### Auto-Generated Observational Studies

![](apps/crowdsourcing-cures/public/docs/components/observational-studies/observational-studies.png)

[👉 More info about observational studies...](apps/crowdsourcing-cures/public/docs/components/observational-studies/observational-studies.md)



## Key Components

### Applications (apps/)

| App | Status | Description |
|-----|--------|-------------|
| [`dfda-node`](apps/dfda-node) | **Canonical product** | White-label clinic and research node. Each customer deployment has isolated configuration, authentication, storage, and patient data. `prototype.dfda.earth` is the reference deployment. |
| [`crowdsourcing-cures`](apps/crowdsourcing-cures) | **Legacy** | Existing Crowdsourcing Cures application and content site. It remains deployable for continuity but is not the target architecture for new product work. |
| [`fdai`](apps/fdai) | Experimental | FDAi interface and experiments. Does not currently build. |

The retired `fda-gov-v2` repository is a feature source for `dfda-node`, not a
second product line. Port useful behavior in reviewed slices; do not merge its
entire divergent history into this repository.


### Packages (packages/)

| Package | Purpose |
| --- | --- |
| `database` | Prisma introspection of the legacy CureDAO MySQL schema |
| `db-ops` | CLIs to inspect and copy data between MySQL and Postgres |
| `mathematical-modeling` | Health-economics models |
| `autonomous-researcher` | Web search + LLM research-report agent |
| `link-checker` | Broken-link checks for the docs |
| `deployer`, `gcp-setup` | Deployment helpers |
| `config-eslint`, `config-typescript` | Shared lint and TypeScript config |


## Technology Stack

- **Frontend**: React, Next.js, TypeScript, Tailwind
- **Canonical node database**: PostgreSQL through Supabase, with Row Level Security and SQL migrations
- **Legacy database code**: Prisma is still used by `crowdsourcing-cures`; it is not the `dfda-node` data layer
- **Authentication**: Supabase Auth in `dfda-node`; legacy apps retain their existing providers during migration
- **Background jobs**: graphile-worker
- **Tooling**: pnpm workspaces, Turborepo, Vitest, Playwright, GitHub Actions
- **Planned, not implemented**: blockchain consent and payment records (see below)


## Getting Started

### Prerequisites

- Node.js 22+
- pnpm
- Docker (for the local Supabase stack)
- Supabase CLI


### Installation

1. Clone the repository:

```shellscript
git clone https://github.com/decentralized-fda/decentralized-fda.git dfda
cd dfda
```


2. Install dependencies:

```shellscript
pnpm install
```


3. Set up environment variables:

```shellscript
cp apps/dfda-node/.env.example apps/dfda-node/.env
# Edit apps/dfda-node/.env with your Supabase credentials
```


4. Start the Clinic Node prototype:

```shellscript
pnpm --filter dfda-node dev:env
```

This starts local Supabase (it needs Docker), then the Next.js server, the background worker (`dev:worker`) and the reminder cron (`dev:cron`). `dev:next` starts only the Next.js server, and `dev` starts it with secrets from Doppler instead of `.env`.

5. The first time, load the database schema and seed data from a second terminal:

```shellscript
pnpm --filter dfda-node db:local:reset
```

### Database Setup

The Clinic Node prototype uses Supabase for its database and authentication. From the repo root:

```bash
pnpm --filter dfda-node sb:local:start   # start only local Supabase
pnpm --filter dfda-node db:local:reset   # apply migrations and seeds
pnpm --filter dfda-node db:local:types   # regenerate TypeScript types
```

The database schema is managed through migrations in the `apps/dfda-node/supabase/migrations` directory. Each migration represents a specific change to the database structure.

### Development Environment

The development environment includes:

- A local Supabase stack (PostgreSQL, Auth, Storage) started by `sb:local:start`
- A graphile-worker process for reminders and background jobs (`dev:worker`)
- A cron process that queues the periodic reminder jobs (`dev:cron`)


## Development Workflow

### Monorepo Structure

The repo uses pnpm workspaces and Turborepo, with the following structure:

```plaintext
dfda/
├── apps/           # Deployable applications (dfda-node, crowdsourcing-cures, fdai)
├── packages/       # Shared libraries and tooling
├── schema/         # Earlier, unapplied database design
├── supabase/       # Earlier combined-migration tooling
├── docs/           # Documentation
└── .github/        # GitHub workflows
```

### Commands

- `pnpm --filter dfda-node dev:env` - Start the Clinic Node prototype with local Supabase, the worker and the cron
- `pnpm --filter dfda-node build` - Build it
- `pnpm --filter dfda-node test` - Run its tests
- `pnpm --filter dfda-node lint` - Lint it


### Adding New Features

1. Determine if the feature belongs in an existing app, a new app, or a shared package
2. Create a new branch: `feature/your-feature-name`
3. Implement the feature following the architectural guidelines
4. Add tests and documentation
5. Submit a pull request


## Blockchain Integration (planned)

None of this is implemented yet.

The dFDA Network incorporates blockchain technology for:

1. **Patient Identity and Consent**

1. Verifiable credentials for patient identity
2. Immutable consent records
3. Privacy-preserving data sharing



2. **Trial Smart Contracts**

1. Automated trial enrollment and participation tracking
2. Transparent protocol definitions
3. Auditable trial history



3. **Supply Chain Tracking**

1. Medication provenance verification
2. Counterfeit detection
3. Adverse event correlation



4. **Payments and Incentives**

1. Automated participant compensation
2. Deposit management
3. Milestone-based payments





### Blockchain Architecture

The blockchain components are designed to integrate with existing services rather than replacing them, providing a gradual adoption path that can evolve over time.


## Deployment (planned)

The Clinic Node prototype currently deploys to Vercel with Supabase Cloud. The setups below are the target.

The dFDA Network is designed for deployment in various environments:

### Local Development

- Docker Compose for local services
- Minikube for Kubernetes testing


### Staging Environment

- Kubernetes cluster with namespaces for different components
- CI/CD pipeline for automated deployments
- Synthetic data for testing


### Production Environment

- Multi-region Kubernetes deployment
- High-availability configuration
- Disaster recovery procedures
- HIPAA-compliant infrastructure


### Deployment Commands

- `pnpm deploy:staging` - Deploy to staging environment
- `pnpm deploy:production` - Deploy to production environment
- `pnpm deploy:blockchain` - Deploy blockchain nodes and contracts


## Contributing

We welcome contributions to the dFDA Network! Please see our [Contributing Guide](./CONTRIBUTING.md) for details on:

- Code of conduct
- Development process
- Pull request workflow
- Coding standards
- Testing requirements


### Key Areas for Contribution

- AI models for meta-analysis
- Blockchain smart contracts
- Gateway Node implementations
- Mobile app features
- Documentation and tutorials
- Internationalization and accessibility


## Roadmap

### Phase 1: Core Infrastructure (Q1-Q2 2025)

- Marketplace MVP
- Digital Twin Safe basic functionality
- Authentication and API foundation
- Initial Gateway Node implementation


### Phase 2: Enhanced Functionality (Q3-Q4 2025)

- AI Meta-Analysis engine
- ClinicalTrials.gov integration
- Reminder system
- Sponsor portal advanced features


### Phase 3: Blockchain Integration (Q1-Q2 2026)

- Blockchain node deployment
- Smart contracts for trials
- Identity and consent management
- Supply chain tracking


### Phase 4: Ecosystem Expansion (Q3-Q4 2026)

- Developer platform and third-party apps
- Advanced AI capabilities
- International expansion
- Regulatory approval pathways


## Key Features

### For Patients

- Discover trials matched to your health profile
- Securely store and control your health data
- Track your participation and outcomes
- Receive personalized insights and recommendations


### For Sponsors

- Create and manage decentralized trials
- Access diverse patient populations
- Reduce administrative overhead
- Analyze real-time trial data


### For Providers

- Refer patients to appropriate trials
- Monitor patient participation
- Access comparative effectiveness data
- Integrate with existing EHR systems


### For Developers

- Build on the dFDA API platform
- Create specialized tools for clinical research
- Integrate with Gateway Nodes
- Leverage blockchain for trust and transparency

