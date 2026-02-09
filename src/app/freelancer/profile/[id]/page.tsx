'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Star, 
  MapPin, 
  Clock, 
  MessageSquare, 
  Bookmark, 
  Share2,
  Award,
  Briefcase,
  DollarSign,
  Calendar,
  TrendingUp,
  ExternalLink,
  ArrowLeft,
  ThumbsUp,
  Zap
} from 'lucide-react';
import { Freelancer, PortfolioItem, Review } from '@/types';
import { getCurrentUser } from '@/lib/auth';

export default function FreelancerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const freelancerId = params.id as string;
  
  const [freelancer, setFreelancer] = useState<Freelancer | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similarFreelancers, setSimilarFreelancers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'reviews'>('overview');
  const currentUser = getCurrentUser();

  useEffect(() => {
    loadFreelancerData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [freelancerId]);

  const loadFreelancerData = async () => {
    try {
      setLoading(true);
      
      // Load freelancer data from real API
      const response = await fetch(`/api/freelancers/${freelancerId}`);
      
      if (!response.ok) {
        router.push('/search/freelancers');
        return;
      }
      
      const data = await response.json();
      
      setFreelancer(data.freelancer);
      setPortfolio(data.portfolio || []);
      setReviews(data.reviews || []);

      // Load similar freelancers if available (optional feature)
      try {
        const similarResponse = await fetch(`/api/freelancers/${freelancerId}/similar`);
        if (similarResponse.ok) {
          const similarData = await similarResponse.json();
          setSimilarFreelancers(similarData.freelancers || []);
        }
      } catch (error) {
        // Similar freelancers is optional, just log if it fails
        console.log('Similar freelancers not available:', error);
        setSimilarFreelancers([]);
      }

      // Check if saved
      const savedProfiles = JSON.parse(localStorage.getItem('savedProfiles') || '[]');
      setIsSaved(savedProfiles.includes(freelancerId));
      
    } catch (error) {
      console.error('Error loading freelancer data:', error);
      router.push('/search/freelancers');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = () => {
    const savedProfiles = JSON.parse(localStorage.getItem('savedProfiles') || '[]');
    
    if (isSaved) {
      const updated = savedProfiles.filter((id: string) => id !== freelancerId);
      localStorage.setItem('savedProfiles', JSON.stringify(updated));
      setIsSaved(false);
    } else {
      savedProfiles.push(freelancerId);
      localStorage.setItem('savedProfiles', JSON.stringify(savedProfiles));
      setIsSaved(true);
    }
  };

  const handleContact = () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }
    // Navigate to messaging
    router.push(`/communication?freelancer=${freelancerId}`);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${freelancer?.name} - ${freelancer?.title}`,
        text: `Check out ${freelancer?.name} on NepLancer`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Profile link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!freelancer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">The freelancer you&apos;re looking for doesn&apos;t exist.</p>
          <button
            onClick={() => router.push('/search/freelancers')}
            className="px-6 py-2 bg-primary text-gray-900 rounded-lg hover:bg-primary/90"
          >
            Browse Freelancers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Search
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-8">
              {/* Profile Header */}
              <div className="bg-gradient-to-br from-primary/10 to-blue-50 p-6 text-center">
                <div className="relative inline-block">
                  <img
                    src={freelancer.avatar}
                    alt={freelancer.name}
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg mx-auto"
                  />
                  {freelancer.isOnline && (
                    <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-white rounded-full"></div>
                  )}
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mt-4">{freelancer.name}</h1>
                <p className="text-gray-600 mt-1">{freelancer.title}</p>
                
                {/* Location */}
                <div className="flex items-center justify-center text-gray-500 mt-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{freelancer.location}</span>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-center mt-3">
                  <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="font-bold text-gray-900">{freelancer.rating}</span>
                    <span className="text-gray-500 text-sm ml-1">({freelancer.reviews} reviews)</span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {freelancer.badges?.map((badge, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-700 shadow-sm"
                    >
                      {badge === 'Top Rated' && <Award className="h-3 w-3 mr-1 text-yellow-500" />}
                      {badge === 'Fast Responder' && <Zap className="h-3 w-3 mr-1 text-blue-500" />}
                      {badge}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 space-y-3">
                <button
                  onClick={handleContact}
                  className="w-full flex items-center justify-center px-6 py-3 bg-primary text-gray-900 rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Contact {(freelancer.name || 'Freelancer').split(' ')[0]}
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleSaveProfile}
                    className={`flex items-center justify-center px-4 py-2 border rounded-lg transition-colors ${
                      isSaved
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? 'fill-current' : ''}`} />
                    {isSaved ? 'Saved' : 'Save'}
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors"
                  >
                    <Share2 className="h-4 w-4 mr-2"/>
                    Share
                  </button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="border-t border-gray-200 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                      <span className="text-sm">Hourly Rate</span>
                    </div>
                    <span className="font-semibold text-gray-900">${freelancer.hourlyRate}/hr</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600">
                      <Briefcase className="h-5 w-5 mr-2 text-blue-600" />
                      <span className="text-sm">Jobs Completed</span>
                    </div>
                    <span className="font-semibold text-gray-900">{freelancer.jobsCompleted}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600">
                      <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                      <span className="text-sm">Total Earned</span>
                    </div>
                    <span className="font-semibold text-gray-900">${(freelancer.totalEarnings || 0).toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-5 w-5 mr-2 text-orange-600"/>
                      <span className="text-sm">Response Time</span>
                    </div>
                    <span className="font-semibold text-gray-900">{freelancer.responseTime}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-gray-600">
                      <ThumbsUp className="h-5 w-5 mr-2 text-pink-600"/>
                      <span className="text-sm">Success Rate</span>
                    </div>
                    <span className="font-semibold text-gray-900">{freelancer.successRate}%</span>
                  </div>
                </div>
              </div>

              {/* Availability */}
              <div className="border-t border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-gray-600" />
                    <span className="text-sm text-gray-600">Availability</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    freelancer.availability === 'Available Now'
                      ? 'bg-green-100 text-green-800'
                      : freelancer.availability === 'Available in 1 week'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {freelancer.availability}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6" aria-label="Tabs">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'overview'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('portfolio')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'portfolio'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Portfolio ({portfolio.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'reviews'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Reviews ({reviews.length})
                  </button>
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    {/* About */}
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-4">About {(freelancer.name || 'Freelancer').split(' ')[0]}</h2>
                      <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {freelancer.bio}
                      </p>
                    </div>

                    {/* Skills */}
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Skills & Expertise</h2>
                      <div className="flex flex-wrap gap-2">
                        {freelancer.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Experience */}
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Experience</h2>
                      <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                        <Briefcase className="h-6 w-6 text-primary mt-1" />
                        <div>
                          <p className="font-semibold text-gray-900">{freelancer.experienceLevel}</p>
                          <p className="text-gray-600 text-sm mt-1">
                            {freelancer.jobsCompleted}+ projects completed with a {freelancer.successRate}% success rate
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Languages */}
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Languages</h2>
                      <div className="space-y-2">
                        {freelancer.languages?.map((lang, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-900">{lang.language}</span>
                            <span className="text-sm text-gray-600">{lang.proficiency}</span>
                          </div>
                        )) || (
                          <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-gray-900">English</span>
                            <span className="text-sm text-gray-600">Fluent</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Education */}
                    {freelancer.education && (
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Education</h2>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="font-semibold text-gray-900">{freelancer.education}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Portfolio Tab */}
                {activeTab === 'portfolio' && (
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Portfolio</h2>
                    {portfolio.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {portfolio.map((item) => (
                          <div
                            key={item.id}
                            className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow group"
                          >
                            <div className="relative aspect-video bg-gradient-to-br from-primary/20 to-blue-100 overflow-hidden">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Briefcase className="h-16 w-16 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="p-4">
                              <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {item.description}
                              </p>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {item.technologies.slice(0, 3).map((tech, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                                  >
                                    {tech}
                                  </span>
                                ))}
                              </div>
                              {item.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-primary hover:text-primary/80 text-sm font-medium"
                                >
                                  View Project <ExternalLink className="h-4 w-4 ml-1" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No portfolio items yet</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Reviews Tab */}
                {activeTab === 'reviews' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-bold text-gray-900">Client Reviews</h2>
                      <div className="flex items-center space-x-2">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-gray-900">{freelancer.rating}</span>
                        <span className="text-gray-500">({reviews.length} reviews)</span>
                      </div>
                    </div>

                    {reviews.length > 0 ? (
                      <div className="space-y-6">
                        {reviews.map((review) => (
                          <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                            <div className="flex items-start space-x-4">
                              <img
                                src={review.clientAvatar}
                                alt={review.clientName}
                                className="w-12 h-12 rounded-full"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <h3 className="font-semibold text-gray-900">{review.clientName}</h3>
                                    <div className="flex items-center mt-1">
                                      <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                          <Star
                                            key={i}
                                            className={`h-4 w-4 ${
                                              i < review.rating
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-gray-300'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      <span className="text-sm text-gray-500 ml-2">{review.date}</span>
                                    </div>
                                  </div>
                                </div>
                                <p className="text-gray-700 mb-2">{review.comment}</p>
                                {review.projectTitle && (
                                  <p className="text-sm text-gray-500">
                                    Project: <span className="font-medium">{review.projectTitle}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No reviews yet</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Similar Freelancers */}
            {similarFreelancers.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Similar Freelancers</h2>
                  <button
                    onClick={() => router.push(`/search/freelancers`)}
                    className="text-primary hover:text-primary/80 text-sm font-medium"
                  >
                    View All
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {similarFreelancers.map((similar) => {
                    const profile = similar.profiles;
                    const name = profile?.full_name || 'Unknown';
                    const avatar = profile?.avatar_url || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`;
                    
                    return (
                      <div
                        key={similar.id}
                        onClick={() => router.push(`/freelancer/profile/${similar.id}`)}
                        className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow cursor-pointer relative"
                      >
                        {/* Similarity Badge */}
                        {similar.score && (
                          <div className="absolute top-2 right-2">
                            <div className="bg-[#0CF574]/10 text-[#0CF574] px-2 py-1 rounded-md text-xs font-bold">
                              {Math.round(similar.score.finalScore)}% Similar
                            </div>
                          </div>
                        )}
                        
                        <div className="text-center pt-4">
                          <img
                            src={avatar}
                            alt={name}
                            className="w-20 h-20 rounded-full mx-auto mb-3 object-cover"
                          />
                          <h3 className="font-semibold text-gray-900 mb-1">{name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{similar.title || 'Freelancer'}</p>
                          <div className="flex items-center justify-center mb-2">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                            <span className="text-sm font-medium">{(similar.rating || 0).toFixed(1)}</span>
                            <span className="text-sm text-gray-500 ml-1">({similar.completed_jobs || 0})</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">${(similar.hourly_rate || 0).toLocaleString()}/hr</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
