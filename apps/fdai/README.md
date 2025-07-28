# FDAi - Food & Drug AI Health Insights

FDAi helps users quantify exactly how specific foods and treatments are helping or hurting their health conditions through AI-powered analysis and tracking.

## Overview

FDAi is a full-stack Next.js application that provides:

- AI-powered health chatbot for tracking symptoms, meals, and medications
- Personalized insights on how diet and medications affect health conditions
- Multi-modal interaction (text, voice, images)
- Comprehensive health data tracking and visualization

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (for database and authentication)

### Environment Variables

Create a `.env.local` file with the following variables:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
\`\`\`

### Installation

1. Clone the repository
2. Install dependencies:
   \`\`\`
   npm install
   \`\`\`
3. Set up the database:
   - Run the SQL scripts in the `supabase/sql` directory in your Supabase SQL editor
   - Start with `schema/tables.sql`, then `schema/functions.sql`, then the seed data scripts
4. Start the development server:
   \`\`\`
   npm run dev
   \`\`\`

## Project Structure

- `/app` - Next.js App Router pages and API routes
- `/components` - React components
- `/contexts` - React context providers
- `/lib` - Utility functions and services
- `/public` - Static assets
- `/supabase` - Supabase-related files (SQL scripts, types)

## TODO List

### Immediate Priorities

- [x] Implement basic chatbot functionality
- [x] Set up Supabase authentication
- [x] Create database schema
- [x] Implement admin dashboard
- [ ] Complete refactoring of large files (in progress)
- [ ] Implement proper error handling throughout the application

### Refactoring Tasks

- [ ] Extract SQL into separate files
  - [x] Create tables.sql
  - [x] Create functions.sql
  - [x] Create reference-data.sql
  - [x] Create sample-data.sql
  
- [ ] Break up large components
  - [x] Split admin page into smaller components
  
- [ ] Reorganize user data functions
  - [x] Split by domain (profile, goals, conditions, health logs)
  - [ ] Add proper error handling and validation
  - [ ] Add comprehensive TypeScript types

### Feature Implementation

- [ ] Data Analysis Engine
  - [ ] Implement correlation analysis between foods and symptoms
  - [ ] Create visualization components for insights
  - [ ] Develop recommendation algorithm
  
- [ ] Notification System
  - [ ] Implement browser notifications
  - [ ] Set up email notification service
  - [ ] Create scheduled notification system
  
- [ ] Health API Integrations
  - [ ] Integrate with Fitbit API
  - [ ] Integrate with Apple Health (via export)
  - [ ] Integrate with Google Fit
  
- [ ] Advanced Image Recognition
  - [ ] Implement food recognition from photos
  - [ ] Add medication identification from images
  - [ ] Create nutrition extraction from food labels
  
- [ ] Scheduled Check-ins
  - [ ] Implement daily check-in reminders
  - [ ] Create weekly health summary reports
  - [ ] Develop adaptive check-in schedules

### UI/UX Improvements

- [ ] Create responsive designs for all components
- [ ] Implement dark mode consistently across all components
- [ ] Add loading states and skeleton loaders
- [ ] Improve accessibility (ARIA attributes, keyboard navigation)
- [ ] Add animations and transitions for better user experience

### Technical Improvements

- [ ] Set up comprehensive testing
  - [ ] Unit tests for utility functions
  - [ ] Component tests with React Testing Library
  - [ ] End-to-end tests with Cypress
  
- [ ] Improve performance
  - [ ] Implement proper data fetching strategies
  - [ ] Add caching for frequently accessed data
  - [ ] Optimize bundle size
  
- [ ] Enhance security
  - [ ] Implement proper Row Level Security in Supabase
  - [ ] Add CSRF protection
  - [ ] Set up rate limiting for API routes
  
- [ ] Improve developer experience
  - [ ] Add comprehensive documentation
  - [ ] Set up CI/CD pipeline
  - [ ] Implement linting and formatting rules

### Documentation

- [ ] Create comprehensive API documentation
- [ ] Add JSDoc comments to all functions
- [ ] Create user guide and onboarding documentation
- [ ] Document database schema and relationships

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
