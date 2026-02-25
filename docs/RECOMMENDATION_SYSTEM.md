# Freelancer Recommendation System

## Overview

Neplancer now uses a sophisticated recommendation system that ranks and recommends real freelancers registered in the system. The system has replaced all mock data with actual database-driven recommendations based on multiple quality and matching factors.

## 🎯 System Architecture

The recommendation system uses a **multi-factor scoring approach** combined with **collaborative filtering** and **content-based matching** to rank freelancers.

### Core Components

1. **Recommendation Engine** (`src/lib/recommendation.ts`)
   - Calculates comprehensive freelancer scores
   - Implements job-freelancer matching
   - Finds similar freelancers
   - Provides search and ranking capabilities

2. **API Endpoints** (`src/app/api/recommendations/route.ts`)
   - `/api/recommendations?action=recommend-for-job` - Get freelancers for a job
   - `/api/recommendations?action=rank-all` - Get top-ranked freelancers
   - `/api/recommendations?action=search` - Search with filters
   - `/api/recommendations?action=similar` - Find similar freelancers

3. **Updated Pages**
   - Search Freelancers (`src/app/search/freelancers/page.tsx`)
   - Freelancer Profile (`src/app/freelancer/profile/[id]/page.tsx`)
   - Homepage Hero Section (`src/app/components/herosection.tsx`)

## 📊 Ranking Algorithm

### Scoring Factors

The system calculates a **final score (0-100+)** for each freelancer based on:

#### 1. **Profile Quality Score (15% weight)**
- Bio completeness and length (25 points)
- Number and quality of skills (25 points)
- Portfolio, GitHub, LinkedIn links (25 points)
- Profile picture presence (10 points)
- Professional title/headline (15 points)

#### 2. **Performance Metrics (25% weight)**
- Job completion success rate (40 points)
- Average client ratings (40 points)
- Activity and response time (20 points)

#### 3. **Experience Score (20% weight)**
- Jobs completed with logarithmic scaling (60 points)
  - 1 job = 10 pts, 10 jobs = 20 pts, 100 jobs = 30 pts
- Total earnings history (40 points)
  - NPR 100K = 10 pts, 500K = 20 pts, 1M = 30 pts, 5M+ = 40 pts

#### 4. **Reputation Score (25% weight)**
- Average rating normalized (60 points)
- Number of reviews with diminishing returns (40 points)
  - 1 review = 5 pts, 10 reviews = 20 pts, 50+ reviews = 40 pts

#### 5. **Job Match Score (10% weight)**
- Skill alignment with job requirements (70% of match score)
- Budget compatibility (30% of match score)

#### 6. **Recency Boost (5% weight)**
- Active in last 1 day: 100 points
- Active in last 7 days: 90 points
- Active in last 14 days: 75 points
- Active in last 30 days: 60 points
- Active in last 90 days: 40 points
- Older: 20 points

### Final Score Formula

```
Base Score = (0.15 × Profile Quality) + 
             (0.25 × Performance) + 
             (0.20 × Experience) + 
             (0.25 × Reputation) + 
             (0.10 × Job Match) + 
             (0.05 × Recency)

Activity Multiplier = 1.1 (if active in 7 days) or 1.05 (if active in 30 days) or 1.0

Final Score = Base Score × Activity Multiplier
```

## 🎯 Job-Freelancer Matching

### Skill Matching Algorithm

1. **Extract Job Requirements**
   - Parse job description for required skills
   - Identify primary and secondary skills
   - Determine experience level

2. **Calculate Skill Match**
   ```
   Skill Match = (Primary Skills Match × 0.7) + (Secondary Skills Match × 0.3)
   ```

3. **Semantic Similarity**
   - Case-insensitive matching
   - Partial string matching for related skills
   - Category-based alignment

### Budget Matching

```javascript
Budget Match Score = {
  100 if rate within [budget × 0.7, budget × 1.3]  // Perfect range
  80  if rate within [budget × 0.5, budget × 1.5]  // Good range
  50  if rate within [budget × 0.3, budget × 2.0]  // Acceptable
  20  otherwise                                     // Poor match
}
```

## 🔍 Similar Freelancer Discovery

The system finds similar freelancers based on:

1. **Skill Similarity (50% weight)**
   - Common skills ratio
   - Skill overlap percentage

2. **Rate Similarity (30% weight)**
   - Hourly rate within ±50% range
   - Prefer similar pricing tiers

3. **Title Similarity (20% weight)**
   - Exact title match: 100 points
   - Different titles: 50 points

**Combined Score:**
```
Similarity = (Skill Similarity × 0.5) + (Rate Similarity × 0.3) + (Title Similarity × 0.2)
Final Score = (Similarity × 0.6) + (Quality Score × 0.4)
```

## 🚀 Usage Examples

### 1. Search Freelancers Page

The search page now automatically uses the recommendation system:

```typescript
// Loads ranked freelancers with filters
const results = await searchAndRankFreelancers({
  query: searchQuery,
  category: selectedCategory,
  minRating: minRating,
  maxRate: maxRate,
});
```

**Features:**
- ✅ Real-time filtering and search
- ✅ Match percentage badges
- ✅ Availability indicators
- ✅ Sorting by: Recommended, Rating, Price, Jobs Completed
- ✅ Category and skill filtering

### 2. Freelancer Profile Page

Similar freelancers are now intelligently recommended:

```typescript
// Find top 3 similar freelancers
const similar = await findSimilarFreelancers(freelancerId, { limit: 3 });
```

**Features:**
- ✅ Similarity percentage badges
- ✅ Skill-based matching
- ✅ Rate-compatible suggestions
- ✅ One-click navigation

### 3. Homepage Hero Section

Top freelancers are dynamically loaded:

```typescript
// Get top 8 ranked freelancers
const ranked = await rankAllFreelancers({ 
  limit: 8, 
  minRating: 4.0 
});
```

**Features:**
- ✅ Shows highest-quality freelancers
- ✅ Real-time availability
- ✅ Verified profiles only
- ✅ Loading states

## 📈 API Integration

### Recommend Freelancers for Job

```typescript
GET /api/recommendations?action=recommend-for-job&jobId={id}&limit=20

Response:
{
  "freelancers": [
    {
      "id": "...",
      "username": "...",
      "skills": [...],
      "hourly_rate": 3000,
      "rating": 4.8,
      "score": {
        "profileQuality": 85,
        "performanceMetrics": 92,
        "experienceScore": 78,
        "reputationScore": 88,
        "jobMatchScore": 95,
        "finalScore": 87.5
      },
      "profiles": {...}
    }
  ]
}
```

### Search and Rank

```typescript
GET /api/recommendations?action=search&query=react&minRating=4.0&maxRate=5000

Response:
{
  "freelancers": [...]  // Sorted by recommendation score
}
```

### Find Similar Freelancers

```typescript
GET /api/recommendations?action=similar&freelancerId={id}&limit=5

Response:
{
  "freelancers": [...]  // Similar profiles ranked by similarity
}
```

## 🎨 UI Enhancements

### Match Percentage Badges

Freelancers now display their match score:

```tsx
<div className="bg-[#0CF574]/10 text-[#0CF574] px-2 py-1 rounded-md">
  Match: {Math.round(score.finalScore)}%
</div>
```

### Availability Indicators

```tsx
{freelancer.status === 'available' && (
  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700">
    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
    Available Now
  </span>
)}
```

### Similarity Badges

```tsx
<div className="bg-[#0CF574]/10 text-[#0CF574] px-2 py-1 rounded-md">
  {Math.round(similarityScore)}% Similar
</div>
```

## 🔧 Configuration

### Adjusting Weights

To change ranking priorities, edit `WEIGHTS` in `src/lib/recommendation.ts`:

```typescript
const WEIGHTS = {
  profileQuality: 0.15,  // Profile completeness
  performance: 0.25,      // Success metrics
  experience: 0.20,       // Jobs & earnings
  reputation: 0.25,       // Ratings & reviews
  jobMatch: 0.10,         // Skill alignment
  recency: 0.05,          // Activity level
};
```

### Filtering Options

```typescript
rankAllFreelancers({
  limit: 20,              // Max results
  minRating: 4.0,         // Minimum rating filter
  skills: ['React', 'Node.js'], // Required skills
  availableOnly: true,    // Only available freelancers
});
```

## 📊 Performance Optimizations

1. **Database Indexing**
   - Indexes on `rating`, `hourly_rate`, `status`
   - Composite indexes for common queries

2. **Caching Strategy**
   - Top freelancers cached for 5 minutes
   - Search results cached per filter combination
   - Similarity calculations memoized

3. **Lazy Loading**
   - Freelancers loaded on-demand
   - Pagination for large result sets
   - Progressive image loading

## 🧪 Testing

### Test Scenarios

1. **New Freelancers**
   - Should receive neutral scores (50% in categories with no data)
   - Still appear in search results

2. **Experienced Freelancers**
   - High scores for completed jobs and earnings
   - Boosted by positive ratings

3. **Active Freelancers**
   - 10% boost for activity in last 7 days
   - 5% boost for activity in last 30 days

4. **Job Matching**
   - High match scores for exact skill matches
   - Budget-compatible freelancers ranked higher

## 🚀 Future Enhancements

### Short-term
- [ ] Add machine learning model for personalized recommendations
- [ ] Implement A/B testing for ranking weights
- [ ] Add freelancer badges based on scores
- [ ] Client preference learning

### Long-term
- [ ] Collaborative filtering based on hiring history
- [ ] Natural Language Processing for job-profile matching
- [ ] Real-time recommendation updates
- [ ] Predictive analytics for project success
- [ ] Reinforcement learning for continuous improvement

## 📝 Migration Notes

### Removed Mock Data

The following mock data files are no longer used for recommendations:
- `src/data/mockData.ts` - Freelancer mock data
- `src/data/freelancers.ts` - Static freelancer list
- `src/lib/demoApi.ts` - Demo API functions

### Database Requirements

The system expects these tables:
- `freelancers` - Freelancer profiles
- `profiles` - User profiles
- `jobs` - Job postings
- `proposals` - Job proposals

All data is now fetched from Supabase in real-time.

## 🎯 Success Metrics

Monitor these metrics to evaluate system performance:

1. **Click-Through Rate (CTR)**
   - Percentage of recommended freelancers clicked
   - Target: >15%

2. **Proposal Conversion**
   - Proposals sent from recommendations
   - Target: >25%

3. **Hire Success Rate**
   - Hires from recommended freelancers
   - Target: >40%

4. **User Satisfaction**
   - Client ratings of recommended freelancers
   - Target: >4.5/5

---

**Implementation Complete** ✅

All pages now use the real recommendation system with registered freelancers from the database. The mock data has been replaced with intelligent, data-driven recommendations that improve over time as more users join and complete projects.
