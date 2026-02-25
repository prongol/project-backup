# NepFree - Freelancing Platform Project Structure

## Overview
This project structure is based on the provided flowchart and follows Next.js 13+ App Router conventions.

## Folder Structure

```
nepfree/
├── src/
│   ├── app/
│   │   ├── (auth)/                    # Authentication routes group
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # Login page
│   │   │   └── register/
│   │   │       └── page.tsx          # Registration page
│   │   │
│   │   ├── (dashboard)/               # Dashboard routes group
│   │   │   └── dashboard/
│   │   │       └── page.tsx          # Main dashboard
│   │   │
│   │   ├── client/                    # Client-specific routes
│   │   │   ├── post-job/
│   │   │   │   └── page.tsx          # Post job form
│   │   │   └── jobs/
│   │   │       └── page.tsx          # Client's posted jobs
│   │   │
│   │   ├── freelancer/                # Freelancer-specific routes
│   │   │   ├── browse-jobs/
│   │   │   │   └── page.tsx          # Browse available jobs
│   │   │   └── my-proposals/
│   │   │       └── page.tsx          # Freelancer's proposals
│   │   │
│   │   ├── communication/
│   │   │   └── page.tsx              # Messaging system
│   │   │
│   │   ├── contracts/
│   │   │   ├── page.tsx              # Contracts list
│   │   │   └── [id]/
│   │   │       └── page.tsx          # Contract details
│   │   │
│   │   ├── components/                # Shared components
│   │   │   ├── navbar.tsx
│   │   │   ├── herosection.tsx
│   │   │   ├── signin.tsx
│   │   │   ├── AuthGuard.tsx         # Route protection
│   │   │   └── JobCard.tsx           # Job display component
│   │   │
│   │   ├── api/                       # API routes
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts
│   │   │   │   └── register/
│   │   │   │       └── route.ts
│   │   │   ├── jobs/
│   │   │   │   └── route.ts
│   │   │   ├── proposals/
│   │   │   │   └── route.ts
│   │   │   └── contracts/
│   │   │       └── route.ts
│   │   │
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   │
│   ├── lib/                           # Utility functions
│   │   ├── api.ts                    # API client utilities
│   │   └── auth.ts                   # Authentication utilities
│   │
│   ├── hooks/                         # Custom React hooks
│   │   └── useAuth.ts                # Authentication hook
│   │
│   └── types/                         # TypeScript type definitions
│       └── index.ts                  # All type definitions
│
├── public/                            # Static assets
└── Configuration files

```

## Flow Implementation

### 1. Authentication Flow (Start → Login/Register)
- **Files**: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`
- **API**: `src/app/api/auth/login/route.ts`, `src/app/api/auth/register/route.ts`

### 2. Client Path
- **Client Dashboard** → `src/app/(dashboard)/dashboard/page.tsx`
- **Post Jobs** → `src/app/client/post-job/page.tsx`
- **My Jobs** → `src/app/client/jobs/page.tsx`
- **Wait for Contact** → Implemented via notifications in dashboard

### 3. Freelancer Path
- **Freelancer Dashboard** → `src/app/(dashboard)/dashboard/page.tsx`
- **Browse Jobs** → `src/app/freelancer/browse-jobs/page.tsx`
- **My Proposals** → `src/app/freelancer/my-proposals/page.tsx`
- **Interested Decision** → Implemented in job detail pages

### 4. Communication Flow
- **Messages** → `src/app/communication/page.tsx`
- Handles both client and freelancer messaging

### 5. Agreement & Contract Flow
- **Contracts List** → `src/app/contracts/page.tsx`
- **Contract Details** → `src/app/contracts/[id]/page.tsx`
- **Make a Contract** → Form in contract creation flow

## Key Features by Module

### Types (`src/types/index.ts`)
- User, Client, Freelancer
- Job, Proposal, Contract
- Message, Conversation

### API Routes (`src/app/api/`)
- Authentication (login, register)
- Jobs (CRUD operations)
- Proposals (submit, manage)
- Contracts (create, view)

### Utilities (`src/lib/`)
- API client for making requests
- Authentication helpers
- Token management

### Hooks (`src/hooks/`)
- `useAuth` - Manage authentication state

### Components (`src/app/components/`)
- `AuthGuard` - Protect routes
- `JobCard` - Display job listings
- `Navbar`, `HeroSection`, `SignIn` - UI components

## Next Steps

1. **Database Setup**: Implement database (PostgreSQL, MongoDB, etc.)
2. **Authentication**: Integrate NextAuth.js or implement JWT
3. **Real-time Communication**: Add WebSocket for messaging
4. **Payment Integration**: Add payment gateway for contracts
5. **File Upload**: Implement portfolio/document uploads
6. **Search & Filters**: Add advanced job search functionality
7. **Notifications**: Implement notification system
8. **Reviews & Ratings**: Add rating system for completed jobs

## Development Workflow

1. Start with authentication
2. Build job posting and browsing
3. Implement proposal system
4. Add messaging functionality
5. Create contract system
6. Add dashboard analytics
7. Implement notifications
8. Polish UI/UX

