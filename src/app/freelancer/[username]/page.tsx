'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { 
  Star, MapPin, Calendar, Clock, CheckCircle2, 
  Briefcase, DollarSign, TrendingUp, MessageSquare,
  Shield, ExternalLink, ChevronDown, ChevronUp,
  Search, ThumbsUp, ThumbsDown, Flag, Reply
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Types
interface FreelancerProfile {
  id: string;
  username: string;
  full_name: string;
  profile_photo: string;
  professional_title: string;
  location: string;
  member_since: string;
  last_active: string;
  bio: string;
  hourly_rate: number;
  availability_status: 'available' | 'busy' | 'not_available';
  languages: { language: string; proficiency: string }[];
  skills: string[];
  portfolio: PortfolioItem[];
  work_experience: WorkExperience[];
  education: Education[];
  certifications: Certification[];
  verification: {
    email: boolean;
    phone: boolean;
    identity: boolean;
    payment: boolean;
  };
  stats: {
    overall_rating: number;
    total_reviews: number;
    jobs_completed: number;
    total_earned: number;
    success_rate: number;
    rehire_rate: number;
    on_time_delivery_rate: number;
    response_time: string;
  };
  ratings_breakdown: {
    communication: number;
    quality: number;
    professionalism: number;
    deadlines: number;
  };
  rating_distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  images: string[];
  link: string;
  client_testimonial?: string;
  client_name?: string;
}

interface WorkExperience {
  id: string;
  company: string;
  position: string;
  start_date: string;
  end_date: string | null;
  description: string;
  logo?: string;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  start_date: string;
  end_date: string;
  logo?: string;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date?: string;
  credential_id?: string;
  verified: boolean;
}

interface Review {
  id: string;
  client_name: string;
  client_username: string;
  client_photo: string;
  job_title: string;
  job_id: string;
  date: string;
  overall_rating: number;
  communication_rating: number;
  quality_rating: number;
  professionalism_rating: number;
  deadlines_rating: number;
  testimonial: string;
  freelancer_response?: string;
  helpful_count: number;
  not_helpful_count: number;
}

interface Proposal {
  id: string;
  job_title: string;
  job_id: string;
  client_name: string;
  client_username: string;
  proposed_amount: number;
  submission_date: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'completed';
  cover_letter_excerpt: string;
  final_payment?: number;
  client_rating?: number;
}

export default function FreelancerPublicProfile() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'portfolio' | 'reviews' | 'proposals'>('overview');
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioItem | null>(null);
  const [reviewFilter, setReviewFilter] = useState<'recent' | 'highest' | 'lowest'>('recent');
  const [reviewSearch, setReviewSearch] = useState('');
  const [expandedExperience, setExpandedExperience] = useState<string[]>([]);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const response = await fetch(`/api/freelancer/${username}/profile`);
      if (!response.ok) throw new Error('Profile not found');
      const data = await response.json();
      setProfile(data.profile);
      setReviews(data.reviews);
      setProposals(data.proposals);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExperience = (id: string) => {
    setExpandedExperience(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'accepted':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'rejected':
      case 'withdrawn':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'text-green-600 bg-green-50';
      case 'busy':
        return 'text-yellow-600 bg-yellow-50';
      case 'not_available':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const filteredReviews = reviews
    .filter(review => 
      reviewSearch === '' || 
      review.testimonial.toLowerCase().includes(reviewSearch.toLowerCase()) ||
      review.client_name.toLowerCase().includes(reviewSearch.toLowerCase())
    )
    .sort((a, b) => {
      if (reviewFilter === 'highest') return b.overall_rating - a.overall_rating;
      if (reviewFilter === 'lowest') return a.overall_rating - b.overall_rating;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">The freelancer profile you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/freelancer/browse-jobs')}>
            Browse Freelancers
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <Card className="mb-6">
          <div className="p-8">
            <div className="flex items-start gap-6">
              {/* Profile Photo */}
              <Image
                src={profile.profile_photo || '/default-avatar.png'}
                alt={profile.full_name}
                width={128}
                height={128}
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />

              {/* Main Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{profile.full_name}</h1>
                    <p className="text-gray-600">@{profile.username}</p>
                    <p className="text-xl text-gray-700 mt-2">{profile.professional_title}</p>
                  </div>

                  <Button
                    onClick={() => router.push(`/communication/messages?user=${username}`)}
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Contact
                  </Button>
                </div>

                {/* Location and Status */}
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {new Date(profile.member_since).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{profile.last_active}</span>
                  </div>
                </div>

                {/* Rating and Stats */}
                <div className="flex items-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    {renderStars(profile.stats.overall_rating, 'lg')}
                    <span className="text-2xl font-bold text-gray-900">
                      {profile.stats.overall_rating.toFixed(1)}
                    </span>
                    <span className="text-gray-600">
                      ({profile.stats.total_reviews} reviews)
                    </span>
                  </div>
                  <div className="text-green-600 font-semibold">
                    {profile.stats.success_rate}% Success Rate
                  </div>
                  <div className="text-gray-700">
                    Response time: {profile.stats.response_time}
                  </div>
                </div>

                {/* Verification Badges */}
                <div className="flex items-center gap-2 mt-4">
                  {profile.verification.email && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Email Verified</span>
                    </div>
                  )}
                  {profile.verification.phone && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Phone Verified</span>
                    </div>
                  )}
                  {profile.verification.identity && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                      <Shield className="w-4 h-4" />
                      <span>Identity Verified</span>
                    </div>
                  )}
                  {profile.verification.payment && (
                    <div className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Payment Verified</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {profile.stats.jobs_completed}
                </div>
                <div className="text-sm text-gray-600">Jobs Completed</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  ${profile.stats.total_earned.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Earned</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {profile.stats.rehire_rate}%
                </div>
                <div className="text-sm text-gray-600">Rehire Rate</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-50 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {profile.stats.on_time_delivery_rate}%
                </div>
                <div className="text-sm text-gray-600">On-Time Delivery</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'portfolio', label: 'Portfolio' },
            { id: 'reviews', label: `Reviews (${reviews.length})` },
            { id: 'proposals', label: 'Proposal History' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="col-span-2 space-y-6">
              {/* About Section */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="text-2xl font-bold text-blue-600">
                    ${profile.hourly_rate}/hr
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getAvailabilityColor(profile.availability_status)}`}>
                    {profile.availability_status === 'available' && 'Available Now'}
                    {profile.availability_status === 'busy' && 'Busy'}
                    {profile.availability_status === 'not_available' && 'Not Available'}
                  </div>
                </div>
              </Card>

              {/* Skills Section */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium cursor-pointer hover:bg-blue-100"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </Card>

              {/* Work Experience */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Work Experience</h2>
                <div className="space-y-4">
                  {profile.work_experience.map((exp) => (
                    <div key={exp.id} className="border-l-2 border-gray-200 pl-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {exp.logo && (
                            <Image src={exp.logo} alt={exp.company} width={48} height={48} className="w-12 h-12 rounded" />
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900">{exp.position}</h3>
                            <p className="text-gray-700">{exp.company}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                              {' - '}
                              {exp.end_date ? new Date(exp.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Present'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleExperience(exp.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {expandedExperience.includes(exp.id) ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      {expandedExperience.includes(exp.id) && (
                        <p className="mt-2 text-gray-600">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>

              {/* Education */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Education & Certifications</h2>
                <div className="space-y-4">
                  {profile.education.map((edu) => (
                    <div key={edu.id} className="flex items-start gap-3">
                      {edu.logo && (
                        <Image src={edu.logo} alt={edu.institution} width={48} height={48} className="w-12 h-12 rounded" />
                      )}
                      <div>
                        <h3 className="font-semibold text-gray-900">{edu.degree} in {edu.field}</h3>
                        <p className="text-gray-700">{edu.institution}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(edu.start_date).getFullYear()} - {new Date(edu.end_date).getFullYear()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {profile.certifications.length > 0 && (
                  <>
                    <div className="border-t border-gray-200 my-4"></div>
                    <div className="space-y-3">
                      {profile.certifications.map((cert) => (
                        <div key={cert.id} className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900">{cert.name}</h3>
                              {cert.verified && (
                                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                              )}
                            </div>
                            <p className="text-gray-700">{cert.issuer}</p>
                            <p className="text-sm text-gray-500">
                              Issued {new Date(cert.issue_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                              {cert.expiry_date && ` • Expires ${new Date(cert.expiry_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`}
                            </p>
                            {cert.credential_id && (
                              <p className="text-xs text-gray-500 mt-1">Credential ID: {cert.credential_id}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Languages */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Languages</h2>
                <div className="space-y-3">
                  {profile.languages.map((lang, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{lang.language}</span>
                      <span className="text-sm text-gray-600">{lang.proficiency}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Ratings Breakdown — only shown when the freelancer has at least one review */}
              {profile.stats.total_reviews > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Ratings Breakdown</h2>
                <div className="space-y-4">
                  {[
                    { label: 'Communication', value: profile.ratings_breakdown.communication },
                    { label: 'Quality of Work', value: profile.ratings_breakdown.quality },
                    { label: 'Professionalism', value: profile.ratings_breakdown.professionalism },
                    { label: 'Adherence to Deadlines', value: profile.ratings_breakdown.deadlines },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">{item.label}</span>
                        <span className="text-sm font-semibold text-gray-900">{item.value.toFixed(1)}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${(item.value / 5) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Rating Distribution</h3>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = profile.rating_distribution[stars as keyof typeof profile.rating_distribution];
                      const percentage = (count / profile.stats.total_reviews) * 100;
                      return (
                        <div key={stars} className="flex items-center gap-2">
                          <span className="text-sm text-gray-700 w-8">{stars}★</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-400 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
              )}
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="grid grid-cols-3 gap-6">
            {profile.portfolio.map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedPortfolio(item)}
              >
                <Image
                  src={item.images[0] || '/placeholder-project.png'}
                  alt={item.title}
                  width={400}
                  height={192}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
                  {item.client_testimonial && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 italic line-clamp-2">
                        &quot;{item.client_testimonial}&quot;
                      </p>
                      {item.client_name && (
                        <p className="text-xs text-gray-600 mt-1">- {item.client_name}</p>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {/* Filters */}
            <Card className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search reviews..."
                    value={reviewSearch}
                    onChange={(e) => setReviewSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={reviewFilter}
                  onChange={(e) => setReviewFilter(e.target.value as typeof reviewFilter)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="recent">Most Recent</option>
                  <option value="highest">Highest Rated</option>
                  <option value="lowest">Lowest Rated</option>
                </select>
              </div>
            </Card>

            {/* Reviews List */}
            {filteredReviews.map((review) => (
              <Card key={review.id} className="p-6">
                <div className="flex items-start gap-4">
                  <Image
                    src={review.client_photo || '/default-avatar.png'}
                    alt={review.client_name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <button
                          onClick={() => router.push(`/client/${review.client_username}`)}
                          className="font-semibold text-gray-900 hover:text-blue-600"
                        >
                          {review.client_name}
                        </button>
                        <button
                          onClick={() => router.push(`/jobs/${review.job_id}`)}
                          className="text-sm text-blue-600 hover:text-blue-700 block"
                        >
                          {review.job_title}
                        </button>
                        <p className="text-sm text-gray-500">
                          {new Date(review.date).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderStars(review.overall_rating)}
                        <span className="font-semibold text-gray-900">
                          {review.overall_rating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mt-3">
                      {[
                        { label: 'Communication', value: review.communication_rating },
                        { label: 'Quality', value: review.quality_rating },
                        { label: 'Professionalism', value: review.professionalism_rating },
                        { label: 'Deadlines', value: review.deadlines_rating },
                      ].map((item) => (
                        <div key={item.label} className="text-center">
                          <div className="text-xs text-gray-600 mb-1">{item.label}</div>
                          <div className="flex justify-center">{renderStars(item.value, 'sm')}</div>
                        </div>
                      ))}
                    </div>

                    <p className="mt-4 text-gray-700">{review.testimonial}</p>

                    {review.freelancer_response && (
                      <div className="mt-4 pl-4 border-l-2 border-blue-200 bg-blue-50 p-3 rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <Reply className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-900">
                            Response from {profile.full_name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{review.freelancer_response}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                      <button className="flex items-center gap-1 hover:text-green-600">
                        <ThumbsUp className="w-4 h-4" />
                        <span>Helpful ({review.helpful_count})</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-red-600">
                        <ThumbsDown className="w-4 h-4" />
                        <span>Not Helpful ({review.not_helpful_count})</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-orange-600">
                        <Flag className="w-4 h-4" />
                        <span>Report</span>
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'proposals' && (
          <div className="space-y-6">
            {/* Proposal Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-gray-900">{proposals.length}</div>
                <div className="text-sm text-gray-600 mt-1">Total Proposals</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-green-600">
                  {Math.round((proposals.filter(p => p.status === 'accepted' || p.status === 'completed').length / proposals.length) * 100)}%
                </div>
                <div className="text-sm text-gray-600 mt-1">Acceptance Rate</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-600">
                  ${Math.round(proposals.reduce((sum, p) => sum + p.proposed_amount, 0) / proposals.length).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 mt-1">Avg. Proposal</div>
              </Card>
              <Card className="p-6 text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {proposals.filter(p => p.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Completed</div>
              </Card>
            </div>

            {/* Proposals List */}
            <Card className="divide-y divide-gray-200">
              {proposals.map((proposal) => (
                <div key={proposal.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => router.push(`/jobs/${proposal.job_id}`)}
                          className="font-semibold text-gray-900 hover:text-blue-600"
                        >
                          {proposal.job_title}
                        </button>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                          {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                        </span>
                      </div>
                      <button
                        onClick={() => router.push(`/client/${proposal.client_username}`)}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        {proposal.client_name}
                      </button>
                      <p className="text-sm text-gray-600 mt-2">{proposal.cover_letter_excerpt}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span>Submitted: {new Date(proposal.submission_date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span className="font-semibold text-gray-900">${proposal.proposed_amount.toLocaleString()}</span>
                        {proposal.status === 'completed' && proposal.final_payment && (
                          <>
                            <span>•</span>
                            <span className="text-green-600">Final: ${proposal.final_payment.toLocaleString()}</span>
                          </>
                        )}
                        {proposal.client_rating && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              {renderStars(proposal.client_rating, 'sm')}
                              <span>{proposal.client_rating.toFixed(1)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Card>

            <div className="text-center text-sm text-gray-500">
              <p>Privacy Note: Full proposal details are visible only to job posters</p>
            </div>
          </div>
        )}

        {/* Portfolio Modal */}
        {selectedPortfolio && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedPortfolio.title}</h2>
                  <button
                    onClick={() => setSelectedPortfolio(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {selectedPortfolio.images.map((image, index) => (
                    <Image
                      key={index}
                      src={image}
                      alt={`${selectedPortfolio.title} ${index + 1}`}
                      width={800}
                      height={600}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ))}
                </div>

                <p className="text-gray-700 mb-4">{selectedPortfolio.description}</p>

                {selectedPortfolio.link && (
                  <a
                    href={selectedPortfolio.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>View Live Project</span>
                  </a>
                )}

                {selectedPortfolio.client_testimonial && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-2">Client Testimonial</h3>
                    <p className="text-gray-700 italic">&quot;{selectedPortfolio.client_testimonial}&quot;</p>
                    {selectedPortfolio.client_name && (
                      <p className="text-gray-600 mt-2">- {selectedPortfolio.client_name}</p>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
