# 🚀 NepLancer - Freelancing Platform for Nepali Talent

## 🎯 Demo Mode - Fully Functional Without Database

**NepLancer** is now running in **DEMO MODE** with Supabase disabled! Experience a fully functional freelancing platform with rich mock data - perfect for demonstrations, testing, and development.

---

## ✨ What's New in Demo Mode

### 🔧 **Technical Changes**
- ✅ **Supabase Disabled** - All database calls replaced with mock data
- ✅ **Demo Authentication** - Quick login as Client or Freelancer
- ✅ **Mock API Layer** - Complete REST API with simulated network delays
- ✅ **Rich Demo Data** - 24 freelancers, 6 jobs, multiple contracts & proposals
- ✅ **Full Feature Set** - All platform features work seamlessly

### 🎭 **Demo Features**
- **Quick Login Options**
  - Login as Client (Post jobs, hire freelancers)
  - Login as Freelancer (Browse jobs, submit proposals)
  - Traditional email/password login (any credentials work!)

- **Complete Platform Experience**
  - Browse freelancer profiles with ratings & portfolios
  - View and post job listings
  - Submit and manage proposals
  - Track active contracts
  - Professional messaging system
  - Beautiful, responsive UI/UX

---

## 🚀 Quick Start

### 1. **Start the Development Server**
```bash
npm run dev
```

### 2. **Access the Application**
Open [http://localhost:3000](http://localhost:3000)

### 3. **Choose Your Experience**

#### **Option A: Quick Demo Login**
On the login page, simply click:
- **"Continue as Client"** - Instantly log in as a client
- **"Continue as Freelancer"** - Instantly log in as a freelancer

#### **Option B: Traditional Login**
Use any email/password combination - they all work in demo mode!

---

## 📦 Demo Data Overview

### 👥 **Users**
- **Clients**: 2 demo clients with active job postings
- **Freelancers**: 24+ talented Nepali freelancers across categories

### 💼 **Jobs**
- **6 Job Listings** covering:
  - Web Development (₹180,000)
  - UI/UX Design (₹95,000)
  - Content Writing (₹45,000)
  - Digital Marketing (₹75,000)
  - Video Production (₹65,000)
  - Logo Design (₹35,000)

### 📝 **Proposals**
- 5 sample proposals with different statuses
- Real-world cover letters and pricing

### 📄 **Contracts**
- 3 active/completed contracts
- Full terms and milestone tracking

### 💬 **Messages**
- Sample conversations between clients and freelancers
- Professional communication examples

---

## 🎨 Key Features

### **For Clients**
- ✅ Post unlimited jobs
- ✅ Browse verified freelancer profiles
- ✅ Review proposals and hire talent
- ✅ Manage contracts and milestones
- ✅ Communicate securely with freelancers

### **For Freelancers**
- ✅ Browse available jobs by category
- ✅ Submit professional proposals
- ✅ Track proposal status
- ✅ Manage active contracts
- ✅ Build your portfolio and reputation

### **Platform Features**
- 🎯 Advanced search and filtering
- ⭐ Rating and review system
- 💰 Transparent pricing (NPR)
- 🏆 Top-rated and verified badges
- 📱 Fully responsive design
- 🎨 Modern, professional UI/UX

---

## 📂 Project Structure

```
neplancer/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── (auth)/            # Auth pages (login/register)
│   │   ├── (dashboard)/       # Dashboard pages
│   │   ├── api/               # API routes (demo mode)
│   │   ├── client/            # Client-specific pages
│   │   ├── freelancer/        # Freelancer-specific pages
│   │   └── search/            # Search functionality
│   │
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── FreelancerCard.tsx
│   │   ├── JobCard.tsx
│   │   └── navbar.tsx
│   │
│   ├── data/                  # Mock data files
│   │   ├── mockData.ts       # Comprehensive demo data
│   │   └── freelancers.ts    # Freelancer profiles
│   │
│   ├── lib/                   # Utility libraries
│   │   ├── auth.ts           # Demo authentication
│   │   ├── demoApi.ts        # Mock API layer
│   │   ├── database.ts       # Demo database functions
│   │   └── supabase.ts       # Disabled (compatibility)
│   │
│   └── types/                 # TypeScript types
│       └── index.ts
│
└── public/                    # Static assets
```

---

## 🔧 Technical Stack

- **Framework**: Next.js 15.5 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0
- **UI Components**: Radix UI + Custom Components
- **Icons**: Lucide React
- **Font**: Manrope (Google Fonts)
- **Authentication**: Demo Mode (localStorage-based)
- **Data Layer**: Mock API with simulated delays

---

## 🎯 Use Cases

### **Perfect For:**
1. **Demonstrations** - Show the platform to stakeholders
2. **Development** - Build features without database setup
3. **Testing** - Test UI/UX with realistic data
4. **Prototyping** - Rapid feature prototyping
5. **Learning** - Study the codebase and architecture

---

## 🔄 Switching to Production Mode

When ready to connect a real database:

### 1. **Install Supabase**
```bash
# Already installed, just needs configuration
```

### 2. **Configure Environment Variables**
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. **Restore Supabase Integration**
- Update `src/lib/supabase.ts` with real Supabase client
- Update `src/lib/auth.ts` to use Supabase auth
- Update `src/lib/database.ts` for real database queries
- Update API routes to use Supabase instead of demoApi

---

## 📊 Demo Data Statistics

| Category | Count | Description |
|----------|-------|-------------|
| Freelancers | 24+ | Across 5 categories |
| Jobs | 6 | Various budgets & skills |
| Proposals | 5 | Different statuses |
| Contracts | 3 | Active & completed |
| Messages | 5+ | Sample conversations |
| Categories | 5 | Design, Dev, Writing, Marketing, Video |

---

## 🎨 Design Philosophy

### **User Experience First**
- Clean, intuitive interfaces
- Responsive on all devices
- Fast loading times
- Smooth animations
- Accessible components

### **Professional & Modern**
- Contemporary design patterns
- Consistent color scheme (Green accent: #0CF574)
- Professional typography
- High-quality visual hierarchy

### **Trust & Credibility**
- Verified badges
- Rating system
- Detailed profiles
- Transparent pricing
- Secure messaging

---

## 🚀 Next Steps

### **Phase 1: Current (Demo Mode)** ✅
- ✅ Complete UI/UX design
- ✅ Mock data and API layer
- ✅ All core features functional
- ✅ Authentication system
- ✅ Responsive design

### **Phase 2: Database Integration** (Future)
- [ ] Set up Supabase/PostgreSQL
- [ ] Real-time subscriptions
- [ ] File upload (avatars, portfolios)
- [ ] Email notifications
- [ ] Payment integration (eSewa, Khalti)

### **Phase 3: Advanced Features** (Future)
- [ ] Video interviews
- [ ] Milestone-based payments
- [ ] Dispute resolution
- [ ] Advanced analytics
- [ ] Mobile app

---

## 📖 API Documentation

### **Demo API Endpoints**

All endpoints return mock data with simulated network delays (200-400ms).

#### **Jobs**
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs?status=open` - Filter by status
- `GET /api/jobs?clientId={id}` - Get jobs by client
- `POST /api/jobs` - Create new job

#### **Proposals**
- `GET /api/proposals` - Get all proposals
- `GET /api/proposals?freelancerId={id}` - By freelancer
- `GET /api/proposals?jobId={id}` - By job
- `POST /api/proposals` - Submit proposal

#### **Contracts**
- `GET /api/contracts` - Get all contracts
- `GET /api/contracts?userId={id}` - By user
- `POST /api/contracts` - Create contract

#### **Authentication**
- `POST /api/auth/login` - Login (any credentials)
- `POST /api/auth/register` - Register new user

---

## 🤝 Contributing

This is a demo/prototype platform. For production deployment:

1. Fork the repository
2. Set up real database
3. Implement payment gateway
4. Add real-time features
5. Deploy to production

---

## 📝 License

This project is open source and available for educational and demonstration purposes.

---

## 💡 Tips for Demo

1. **Start as Freelancer** to browse jobs and submit proposals
2. **Switch to Client** to post jobs and review proposals
3. **Check the communication page** for messaging examples
4. **Explore contracts page** for milestone tracking
5. **View profile demos** for portfolio examples

---

## 🔗 Important Links

- **Main Site**: http://localhost:3000
- **Login Page**: http://localhost:3000/login
- **Browse Freelancers**: http://localhost:3000/search/freelancers
- **Browse Jobs**: http://localhost:3000/freelancer/browse-jobs
- **Post a Job**: http://localhost:3000/client/post-job

---

## 🎉 Enjoy the Demo!

Experience the future of Nepali freelancing with **NepLancer** - where talent meets opportunity!

**Quick Access:**
- 👨‍💼 Login as Client → Post jobs & hire
- 👨‍💻 Login as Freelancer → Find work & earn

---

*Built with ❤️ for the Nepali freelancing community*
