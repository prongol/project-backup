'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Manrope } from 'next/font/google';
import { Search, Filter, Grid, List, Star, MapPin, DollarSign, Clock, CheckCircle, Award } from 'lucide-react';

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const CATEGORIES = [
  'All Categories',
  'Web Development',
  'UI/UX Design',
  'Content Writing',
  'Digital Marketing',
  'Video Editing',
  'Graphic Design'
];

function SearchFreelancersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All Categories');
  const [minRating, setMinRating] = useState(0);
  const [maxRate, setMaxRate] = useState(10000);
  const [sortBy, setSortBy] = useState('rating');
  const [showFilters, setShowFilters] = useState(false);

  // Load freelancers from database
  useEffect(() => {
    const loadFreelancers = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        
        if (searchQuery) params.append('search', searchQuery);
        if (selectedCategory && selectedCategory !== 'All Categories') {
          params.append('category', selectedCategory);
        }
        if (minRating > 0) params.append('minRating', minRating.toString());
        
        const response = await fetch(`/api/freelancers/all?${params.toString()}`);
        if (response.ok) {
          const data = await response.json();
          let results = data.freelancers || [];
          
          // Apply sorting
          switch (sortBy) {
            case 'rating':
              results.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
              break;
            case 'price-low':
              results.sort((a: any, b: any) => (a.hourly_rate || 0) - (b.hourly_rate || 0));
              break;
            case 'price-high':
              results.sort((a: any, b: any) => (b.hourly_rate || 0) - (a.hourly_rate || 0));
              break;
            case 'reviews':
              results.sort((a: any, b: any) => (b.total_reviews || 0) - (a.total_reviews || 0));
              break;
          }
          
          // Apply rate filter
          if (maxRate < 10000) {
            results = results.filter((f: any) => (f.hourly_rate || 0) <= maxRate);
          }
          
          setFreelancers(results);
        }
      } catch (error) {
        console.error('Error loading freelancers:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadFreelancers();
  }, [searchQuery, selectedCategory, minRating, maxRate, sortBy]);

  const FreelancerCard = ({ freelancer }: { freelancer: any }) => {
    const profile = freelancer.profiles;
    const name = profile?.full_name || 'Unknown';
    const avatar = profile?.avatar_url || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`;
    
    if (viewMode === 'grid') {
      return (
        <div 
          onClick={() => router.push(`/freelancer/profile/${freelancer.id}`)}
          className="bg-white rounded-xl border-2 border-gray-200 hover:border-[#0CF574] transition-all p-6 cursor-pointer hover:shadow-lg relative"
        >
          {/* Status Badge */}
          <div className="absolute top-4 right-4">
            <div className={`px-2 py-1 rounded-md text-xs font-bold ${
              freelancer.status === 'online' 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {freelancer.status === 'online' ? 'Online' : 'Offline'}
            </div>
          </div>
          
          {/* Avatar */}
          <div className="flex items-start gap-4 mb-4">
            <img
              src={avatar}
              alt={name}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">{name}</h3>
              <p className="text-gray-600 text-sm">{freelancer.title || 'Freelancer'}</p>
              {freelancer.status === 'available' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded mt-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Available
                </span>
              )}
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="font-bold">{(freelancer.rating || 0).toFixed(1)}</span>
            <span className="text-gray-500 text-sm">({freelancer.completed_jobs || 0} jobs)</span>
          </div>

          {/* Skills */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(freelancer.skills || []).slice(0, 4).map((skill, idx) => (
              <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                {skill}
              </span>
            ))}
            {(freelancer.skills || []).length > 4 && (
              <span className="px-3 py-1 bg-gray-200 text-gray-600 text-sm rounded-full">
                +{(freelancer.skills || []).length - 4}
              </span>
            )}
          </div>

          {/* Rate and Stats */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-1 text-gray-900 font-bold">
              <DollarSign className="w-4 h-4" />
              ${(freelancer.hourly_rate || 0).toLocaleString()}/hr
            </div>
            <button className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors text-sm font-semibold">
              View Profile
            </button>
          </div>
        </div>
      );
    }

    // List view
    return (
      <div 
        onClick={() => router.push(`/freelancer/profile/${freelancer.id}`)}
        className="bg-white rounded-xl border-2 border-gray-200 hover:border-[#0CF574] transition-all p-6 cursor-pointer hover:shadow-lg relative"
      >
        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <div className={`px-3 py-1.5 rounded-md text-sm font-bold ${
            freelancer.status === 'online' 
              ? 'bg-green-100 text-green-600' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {freelancer.status === 'online' ? 'Online' : 'Offline'}
          </div>
        </div>
        
        <div className="flex items-start gap-6">
          <img
            src={avatar}
            alt={name}
            className="w-20 h-20 rounded-full object-cover"
          />
          
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2 pr-20">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">{name}</h3>
                <p className="text-gray-600">{freelancer.title || 'Freelancer'}</p>
                {freelancer.status === 'available' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded mt-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    Available Now
                  </span>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">${(freelancer.hourly_rate || 0).toLocaleString()}/hr</div>
                <div className="flex items-center gap-1 justify-end">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold">{(freelancer.rating || 0).toFixed(1)}</span>
                  <span className="text-gray-500 text-sm">({freelancer.completed_jobs || 0})</span>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(freelancer.skills || []).map((skill, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full">
                  {skill}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Award className="w-4 h-4" />
                ${(freelancer.total_earned || 0).toLocaleString()} earned
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {freelancer.completed_jobs || 0} jobs completed
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`${manrope.className} min-h-screen flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading freelancers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${manrope.className} min-h-screen bg-gray-50 py-8 px-4`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            Find Talented Nepali Freelancers
          </h1>
          <p className="text-gray-600">
            Browse {filteredFreelancers.length} of {freelancers.length} freelancers
          </p>
        </div>

        {/* Search and Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, title, or skills..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0CF574]"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0CF574]"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors flex items-center gap-2 font-semibold"
            >
              <Filter className="w-5 h-5" />
              Filters
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Minimum Rating
                </label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0CF574]"
                >
                  <option value={0}>Any Rating</option>
                  <option value={4.5}>4.5+ Stars</option>
                  <option value={4.0}>4.0+ Stars</option>
                  <option value={3.5}>3.5+ Stars</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Max Hourly Rate
                </label>
                <select
                  value={maxRate}
                  onChange={(e) => setMaxRate(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0CF574]"
                >
                  <option value={10000}>Any Rate</option>
                  <option value={5000}>$5,000 or less</option>
                  <option value={3000}>$3,000 or less</option>
                  <option value={2000}>$2,000 or less</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0CF574]"
                >
                  <option value="recommended">Recommended</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="reviews">Most Jobs Completed</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* View Toggle and Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            Showing <span className="font-bold">{rankedFreelancers.length}</span> results
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Results */}
        {freelancers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No freelancers found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All Categories');
                setMinRating(0);
                setMaxRate(10000);
              }}
              className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors font-semibold"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
          }>
            {freelancers.map(freelancer => (
              <FreelancerCard key={freelancer.id} freelancer={freelancer} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchFreelancersPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SearchFreelancersContent />
    </Suspense>
  );
}

