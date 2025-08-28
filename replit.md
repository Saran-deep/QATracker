# QA Test Coverage Tracker

## Overview

This is a QA Test Coverage Tracker application designed to monitor and evaluate test coverage adherence for QA engineers against their Key Responsibility Areas (KRAs), specifically targeting ≥90% test coverage. The system provides role-based dashboards, peer review workflows, and reporting capabilities to support performance evaluations and team management.

The application serves QA Managers, QA Engineers, and QA Reviewers with different levels of access and functionality, enabling efficient tracking of test coverage scores, assignment of reviewers, and generation of compliance reports.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, utilizing Vite as the build tool and development server. The frontend follows a component-based architecture with:

- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design
- **Styling**: Tailwind CSS with CSS variables for theming
- **Form Handling**: React Hook Form with Zod for validation

The application uses a role-based rendering system where different dashboard views are presented based on user roles (manager, engineer, reviewer).

### Backend Architecture

**Framework**: Express.js server with TypeScript, following a RESTful API design pattern. Key architectural decisions include:

- **Authentication**: Replit OIDC integration with Passport.js for secure user authentication
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **API Design**: RESTful endpoints organized by resource (users, stories, analytics)
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes

The server implements role-based access control where different endpoints require specific user roles for access.

### Database Design

**Database**: PostgreSQL with Drizzle ORM for type-safe database operations. The schema includes:

- **Users Table**: Stores user information with role-based permissions (manager, engineer, reviewer)
- **Stories Table**: Tracks individual test coverage tasks with creator/reviewer assignments
- **Coverage History**: Maintains audit trail of coverage score changes
- **Sessions Table**: Required for authentication session persistence

The database uses enums for roles and status fields to ensure data integrity and uses UUIDs for primary keys.

### Authentication & Authorization

**Authentication Provider**: Replit OIDC with OpenID Connect for secure user authentication. The system:

- Uses session-based authentication with secure cookies
- Implements middleware for protected routes
- Supports role-based access control at the endpoint level
- Maintains user sessions in PostgreSQL for scalability

### Data Flow & State Management

**Client-Server Communication**: The application uses TanStack Query for efficient data fetching and caching:

- Automatic background refetching for real-time data updates
- Optimistic updates for improved user experience
- Error handling with retry mechanisms
- Query invalidation for data consistency

**Form Management**: React Hook Form with Zod validation ensures type-safe form handling and validation both client and server-side.

## External Dependencies

### Core Dependencies

- **@neondatabase/serverless**: PostgreSQL database connection optimized for serverless environments
- **drizzle-orm**: Type-safe ORM for PostgreSQL database operations
- **@tanstack/react-query**: Server state management and data synchronization
- **wouter**: Lightweight client-side routing for React

### UI & Styling

- **@radix-ui/***: Comprehensive collection of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework for consistent styling
- **class-variance-authority**: Type-safe component variants for UI components
- **lucide-react**: Icon library for consistent iconography

### Authentication & Session Management

- **passport**: Authentication middleware for Express.js
- **openid-client**: OpenID Connect client for Replit authentication
- **express-session**: Session management middleware
- **connect-pg-simple**: PostgreSQL session store for express-session

### Development & Build Tools

- **vite**: Modern build tool and development server
- **typescript**: Static type checking for enhanced developer experience
- **@replit/vite-plugin-***: Replit-specific development plugins for enhanced debugging
- **drizzle-kit**: Database migration and schema management tool

### Form Handling & Validation

- **react-hook-form**: Efficient form library with minimal re-renders
- **@hookform/resolvers**: Resolver adapters for validation libraries
- **zod**: Schema validation library for both client and server
- **drizzle-zod**: Integration between Drizzle ORM and Zod for automatic schema generation