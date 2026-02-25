# Navigation & UX Guide - Neplancer

## Overview
This document explains the navigation structure, authentication flow, and UX patterns implemented in the Neplancer platform.

---

## 🎯 Main Navigation Flow

### Home Page (`/`)
- **Navbar**: Dynamic navigation based on authentication state
- **Hero Section**: Toggle between "HIRE" and "GET HIRED" modes
  - **HIRE Mode**: For clients looking to hire freelancers
  - **GET HIRED Mode**: For freelancers looking for work

---

## 🔐 Authentication Flow

### Unauthenticated Users

#### Navbar (Not Logged In)
- **Logo**: Neplancer branding
- **Navigation Items**:
  - Independents (with dropdown)
  - Companies (with dropdown)
  - Creator tools (with dropdown)
- **CTA Buttons**:
  - **Sign up** → Routes to `/register`
  - **Log in** → Routes to `/login`

#### Hero Section Actions
- **HIRE Mode**:
  - Search bar: "What do you need help with?"
  - Button: "Browse 1M+ independents"
  - Action: Redirects to `/register` (to sign up as client)
  
- **GET HIRED Mode**:
  - Search bar: "What kind of work are you looking for?"
  - Button: "Browse available jobs"
  - Action: Redirects to `/register` (to sign up as freelancer)

### Login Page (`/login`)
- Email and password fields
- Remember me checkbox
- Forgot password link
- Link to registration page
- After successful login:
  - **Clients** → Redirected to `/client/post-job`
  - **Freelancers** → Redirected to `/freelancer/browse-jobs`

### Registration Page (`/register`)
- **Role Selection** (prominent toggle):
  - "Find Work" (Freelancer)
  - "Hire Talent" (Client)
- Full name, email, password fields
- Password confirmation
- Link to login page
- After successful registration:
  - **Clients** → Redirected to `/client/post-job`
  - **Freelancers** → Redirected to `/freelancer/browse-jobs`

---

## 👤 Authenticated Navigation

### Navbar (Logged In)

#### For All Users
- **Logo**: Neplancer branding
- **Dashboard** link
- **Messages** link (`/communication`)
- **Contracts** link (`/contracts`)
- **User Menu** (dropdown with avatar):
  - User name and email
  - Role badge (Client/Freelancer)
  - Quick links to all pages
  - **Log out** button

#### Client-Specific Links
- **Post a Job** → `/client/post-job`
- **My Jobs** → `/client/jobs`

#### Freelancer-Specific Links
- **Browse Jobs** → `/freelancer/browse-jobs`
- **My Proposals** → `/freelancer/my-proposals`

### Hero Section (Logged In)

#### HIRE Mode (Client)
- Search redirects to freelancer search
- Browse button goes to `/client/post-job`
- Category clicks search for freelancers in that category

#### GET HIRED Mode (Freelancer)
- Search redirects to job search with query
- Browse button goes to `/freelancer/browse-jobs`
- Category clicks filter jobs by category

---

## 📱 Page Routes & Purpose

### Public Routes
- `/` - Home page with hero section
- `/login` - User login
- `/register` - New user registration

### Client Routes (Protected)
- `/client/post-job` - Create new job posting
- `/client/jobs` - View all posted jobs
- `/dashboard` - Client dashboard overview

### Freelancer Routes (Protected)
- `/freelancer/browse-jobs` - Browse available jobs (with search/filters)
- `/freelancer/my-proposals` - View submitted proposals
- `/dashboard` - Freelancer dashboard overview

### Shared Routes (Protected)
- `/dashboard` - Role-specific dashboard
- `/communication` - Messaging system
- `/contracts` - View and manage contracts
- `/contracts/[id]` - Individual contract details

### Search Routes
- `/search/freelancers?q=query&category=category` - Search freelancers
- `/freelancer/browse-jobs?q=query&category=category` - Search jobs

---

## 🎨 UX Patterns

### 1. **Dynamic Hero Section**
- Content changes based on HIRE/GET HIRED toggle
- Search placeholder text adapts to context
- Button text reflects current mode
- Categories are clickable and context-aware

### 2. **Smart Redirects**
- Unauthenticated users → Registration
- After login → Role-specific landing page
- Context-aware navigation based on user role

### 3. **Role-Based Access**
- Navigation shows only relevant links
- AuthGuard component protects routes
- Automatic redirection for unauthorized access

### 4. **User Menu Dropdown**
- Avatar with initial badge
- User info display
- Role badge (visual hierarchy)
- Quick access to all features
- Clear logout option

### 5. **Visual Feedback**
- Loading states on forms
- Error messages with clear styling
- Hover effects on interactive elements
- Active state indicators

### 6. **Consistent Design Language**
- Manrope font throughout
- Gray-900 primary color
- #0CF574 accent color (green)
- Rounded-full buttons for CTAs
- Smooth transitions (200ms duration)

---

## 🔄 State Management

### Authentication State
Managed via `useAuth` hook:
```typescript
{
  user: User | null,
  loading: boolean,
  logout: () => void,
  isAuthenticated: boolean,
  isClient: boolean,
  isFreelancer: boolean
}
```

### Local Storage
- `user` - User object
- `authToken` - JWT token

---

## 🛡️ Security Features

1. **Protected Routes**: AuthGuard component
2. **Token Management**: Stored in localStorage
3. **Role Verification**: Server-side validation
4. **Password Requirements**: Minimum 8 characters
5. **Secure Redirects**: Prevent unauthorized access

---

## 📊 User Journey Examples

### Client Journey
1. Visit home → Click "HIRE" → Browse independents
2. Redirected to register → Select "Hire Talent"
3. Complete registration
4. Auto-redirected to `/client/post-job`
5. Post a job
6. View proposals in Messages
7. Create contract

### Freelancer Journey
1. Visit home → Click "GET HIRED" → Browse jobs
2. Redirected to register → Select "Find Work"
3. Complete registration
4. Auto-redirected to `/freelancer/browse-jobs`
5. Submit proposal
6. Communicate via Messages
7. Accept contract

---

## 🎯 Next Implementation Steps

1. **Add Protected Route Middleware**
2. **Implement Real Authentication Backend**
3. **Add Search Functionality**
4. **Build Job Listing Pages**
5. **Create Messaging System**
6. **Implement Contract Management**
7. **Add Notifications**
8. **Build User Profiles**

---

## 📝 Development Notes

- All pages use Manrope font for consistency
- Transition duration standardized to 200ms
- Color scheme: Gray-900 (primary), #0CF574 (accent)
- Mobile responsive (Tailwind breakpoints)
- TypeScript for type safety
- Client components for interactivity
