# 🗺️ Navigation Structure Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         NEPLANCER NAVBAR                         │
│                                                                  │
│  Logo    Independents ▾  Companies ▾  Tools ▾    [Sign up] [Log in] │
└─────────────────────────────────────────────────────────────────┘

When NOT LOGGED IN:
═══════════════════════════════════════════════════════════════════

HOME PAGE (/)
├── Toggle: [HIRE] / [GET HIRED]
├── Hero Content (changes based on toggle)
├── Search Bar → Routes to:
│   ├── HIRE Mode: /search/freelancers?q=query
│   └── GET HIRED Mode: /freelancer/browse-jobs?q=query
└── Browse Button → Routes to:
    ├── HIRE Mode: /register (as client)
    └── GET HIRED Mode: /register (as freelancer)

LOGIN PAGE (/login)
├── Email & Password
├── Remember Me
├── Forgot Password Link
└── Success → Redirect:
    ├── Client: /client/post-job
    └── Freelancer: /freelancer/browse-jobs

REGISTER PAGE (/register)
├── Role Selection: [Find Work] / [Hire Talent]
├── Name, Email, Password
├── Confirm Password
└── Success → Redirect:
    ├── Client: /client/post-job
    └── Freelancer: /freelancer/browse-jobs


When LOGGED IN AS CLIENT:
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│  Logo  Dashboard  Post Job  My Jobs  Messages  Contracts  [👤 John] │
└─────────────────────────────────────────────────────────────────┘

CLIENT ROUTES:
/dashboard
├── Overview & Stats
├── Recent Activity
└── Quick Actions

/client/post-job
├── Job Title & Description
├── Budget & Timeline
├── Skills Required
└── Publish Job

/client/jobs
├── All Posted Jobs
├── Active Jobs
├── Completed Jobs
└── For Each Job:
    ├── View Details
    ├── Edit Job
    ├── View Proposals
    └── Close Job

/communication
├── Conversation List
└── Message Thread
    ├── Chat History
    ├── File Attachments
    └── Contract Actions

/contracts
├── All Contracts
└── /contracts/[id]
    ├── Contract Details
    ├── Milestones
    ├── Payments
    └── Contract Actions


When LOGGED IN AS FREELANCER:
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│  Logo  Dashboard  Browse Jobs  Proposals  Messages  Contracts  [👤 Jane] │
└─────────────────────────────────────────────────────────────────┘

FREELANCER ROUTES:
/dashboard
├── Overview & Stats
├── Active Projects
└── Earnings

/freelancer/browse-jobs
├── Search & Filters
│   ├── By Category
│   ├── By Budget
│   ├── By Skills
│   └── By Date
├── Job Cards
└── Job Detail
    ├── Full Description
    ├── Requirements
    ├── Client Info
    └── [Submit Proposal]

/freelancer/my-proposals
├── All Proposals
├── Pending Proposals
├── Accepted Proposals
└── For Each Proposal:
    ├── Job Details
    ├── Proposal Status
    ├── Cover Letter
    └── Edit (if pending)

/communication
├── Conversation List
└── Message Thread
    ├── Chat History
    ├── File Attachments
    └── Proposal Discussion

/contracts
├── Active Contracts
├── Completed Contracts
└── /contracts/[id]
    ├── Contract Details
    ├── Milestones
    ├── Payments
    └── Deliverables


USER MENU DROPDOWN (When logged in):
═══════════════════════════════════════════════════════════════════

┌─────────────────────────┐
│ 👤 John Doe             │
│    john@example.com     │
│    [Client Badge]       │
├─────────────────────────┤
│ Dashboard               │
│ Post a Job (Client)     │
│ My Jobs (Client)        │
│ Browse Jobs (Freelancer)│
│ My Proposals (Free...)  │
│ Messages                │
│ Contracts               │
├─────────────────────────┤
│ Log out                 │
└─────────────────────────┘


ROUTING LOGIC:
═══════════════════════════════════════════════════════════════════

1. UNAUTHENTICATED USER
   ├── Tries to access protected route
   └── → Redirect to /login

2. AUTHENTICATED CLIENT
   ├── Can access:
   │   ├── /dashboard
   │   ├── /client/*
   │   ├── /communication
   │   └── /contracts
   └── Cannot access:
       └── /freelancer/* → Redirect to /dashboard

3. AUTHENTICATED FREELANCER
   ├── Can access:
   │   ├── /dashboard
   │   ├── /freelancer/*
   │   ├── /communication
   │   └── /contracts
   └── Cannot access:
       └── /client/* → Redirect to /dashboard

4. LOGIN SUCCESS
   ├── Client → /client/post-job
   └── Freelancer → /freelancer/browse-jobs

5. LOGOUT
   └── → Redirect to / (home)


SEARCH & DISCOVERY:
═══════════════════════════════════════════════════════════════════

HERO SEARCH (Not logged in):
HIRE Mode:
├── Search Query → /search/freelancers?q={query}
├── Category Click → /search/freelancers?category={category}
└── Browse Button → /register

GET HIRED Mode:
├── Search Query → /freelancer/browse-jobs?q={query}
├── Category Click → /freelancer/browse-jobs?category={category}
└── Browse Button → /register

HERO SEARCH (Logged in):
HIRE Mode (Client):
├── Search Query → /search/freelancers?q={query}
├── Category Click → /search/freelancers?category={category}
└── Browse Button → /client/post-job

GET HIRED Mode (Freelancer):
├── Search Query → /freelancer/browse-jobs?q={query}
├── Category Click → /freelancer/browse-jobs?category={category}
└── Browse Button → /freelancer/browse-jobs


NAVBAR DROPDOWNS (Public Navigation):
═══════════════════════════════════════════════════════════════════

Independents ▾
├── GROW YOUR CAREER
│   ├── Manage freelance projects
│   └── Get verified as an expert
└── INVOICE AND BILL CLIENTS
    ├── Sign contracts
    ├── Send invoices
    └── Commission-free payments

Companies ▾
├── GET DISCOVERED
│   ├── Find jobs
│   └── Get discovered
└── INVOICE AND BILL CLIENTS
    ├── Sign contracts
    ├── Send invoices
    └── Commission-free payments

Creator Tools ▾
└── INVOICE AND BILL CLIENTS
    ├── Sign contracts
    ├── Send invoices
    └── Commission-free payments


STATE MANAGEMENT:
═══════════════════════════════════════════════════════════════════

useAuth Hook:
{
  user: {
    id: string
    name: string
    email: string
    role: 'client' | 'freelancer'
    avatar?: string
  } | null,
  loading: boolean,
  isAuthenticated: boolean,
  isClient: boolean,
  isFreelancer: boolean,
  logout: () => void
}

LocalStorage:
├── user → User object
└── authToken → JWT token


COMPONENT HIERARCHY:
═══════════════════════════════════════════════════════════════════

app/
├── layout.tsx (Root)
│   └── Global Styles
│
├── page.tsx (Home)
│   ├── <Navbar />
│   └── <HeroSection />
│
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx
│
├── (dashboard)/
│   └── dashboard/page.tsx
│       └── <AuthGuard>
│
├── client/
│   ├── post-job/page.tsx
│   │   └── <AuthGuard requireRole="client">
│   └── jobs/page.tsx
│       └── <AuthGuard requireRole="client">
│
├── freelancer/
│   ├── browse-jobs/page.tsx
│   │   └── <AuthGuard requireRole="freelancer">
│   └── my-proposals/page.tsx
│       └── <AuthGuard requireRole="freelancer">
│
├── communication/page.tsx
│   └── <AuthGuard>
│
└── contracts/
    ├── page.tsx
    │   └── <AuthGuard>
    └── [id]/page.tsx
        └── <AuthGuard>


KEY INTERACTIONS:
═══════════════════════════════════════════════════════════════════

1. Hero Toggle Changes:
   ├── Main heading
   ├── Subtitle text
   ├── Search placeholder
   ├── Button text
   └── Category behavior

2. User Menu:
   ├── Click avatar → Toggle menu
   ├── Click outside → Close menu
   └── Click any link → Navigate & close

3. Navigation Hover:
   ├── Hover nav item → Show dropdown
   ├── Move to dropdown → Keep open
   └── Mouse leave → Close dropdown

4. Form Submissions:
   ├── Show loading state
   ├── Disable submit button
   ├── Show errors if any
   └── Redirect on success

5. Route Protection:
   ├── Check authentication
   ├── Check role if required
   ├── Show loading
   └── Redirect if unauthorized
```

## Quick Reference

### URLs
- Home: `/`
- Login: `/login`
- Register: `/register`
- Dashboard: `/dashboard`
- Client Post Job: `/client/post-job`
- Client Jobs: `/client/jobs`
- Browse Jobs: `/freelancer/browse-jobs`
- Proposals: `/freelancer/my-proposals`
- Messages: `/communication`
- Contracts: `/contracts`
- Contract Detail: `/contracts/[id]`
- Search Freelancers: `/search/freelancers?q=query`

### Key Components
- `<Navbar />` - Main navigation
- `<HeroSection />` - Home page hero
- `<AuthGuard />` - Route protection
- `useAuth()` - Authentication hook

### Color Palette
- Primary: `#111827` (gray-900)
- Accent: `#0CF574` (brand green)
- Background: `#FFFFFF`
- Text: `#111827` / `#6B7280`
