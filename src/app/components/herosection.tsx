"use client"
import React, { useState, useEffect } from 'react';
import { Manrope } from "next/font/google";
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { FreelancerCard } from './FreelancerCard';
import Link from 'next/link';
import { 
  Search, 
  ArrowRight, 
  Users, 
  Briefcase, 
  Shield, 
  Star,
  CheckCircle,
  TrendingUp,
  Clock,
  DollarSign
} from 'lucide-react';

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: "normal",
});

// Stats data
const stats = [
  { label: 'Active Freelancers', value: '10,000+', icon: Users },
  { label: 'Projects Completed', value: '25,000+', icon: Briefcase },
  { label: 'Client Satisfaction', value: '98%', icon: Star },
  { label: 'Money Paid Out', value: '$50M+', icon: DollarSign },
];

// Categories data
const categories = [
  { name: 'Web Development', icon: '💻', jobs: 234, color: 'from-blue-500 to-blue-600' },
  { name: 'UI/UX Design', icon: '🎨', jobs: 189, color: 'from-purple-500 to-purple-600' },
  { name: 'Content Writing', icon: '✍️', jobs: 156, color: 'from-orange-500 to-orange-600' },
  { name: 'Digital Marketing', icon: '📈', jobs: 142, color: 'from-green-500 to-green-600' },
  { name: 'Video Editing', icon: '🎬', jobs: 98, color: 'from-red-500 to-red-600' },
  { name: 'Mobile Apps', icon: '📱', jobs: 87, color: 'from-cyan-500 to-cyan-600' },
];

// Features data
const features = [
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'Your payments are protected with escrow until work is approved'
  },
  {
    icon: Clock,
    title: 'Quick Turnaround',
    description: 'Get quality work delivered on time, every time'
  },
  {
    icon: CheckCircle,
    title: 'Verified Talent',
    description: 'All freelancers are verified for skills and professionalism'
  },
  {
    icon: TrendingUp,
    title: 'Grow Together',
    description: 'Build lasting relationships and grow your business'
  },
];

const HeroSection = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'hire' | 'get-hired'>('hire');
  const [searchQuery, setSearchQuery] = useState('');
  const [topFreelancers, setTopFreelancers] = useState<any[]>([]);
  const [loadingFreelancers, setLoadingFreelancers] = useState(true);

  // Derived auth state
  const isAuthenticated = !!user;
  const isClient = user?.role === 'client';
  const isFreelancer = user?.role === 'freelancer';

  // Load top freelancers from database
  useEffect(() => {
    const loadTopFreelancers = async () => {
      try {
        setLoadingFreelancers(true);
        const response = await fetch('/api/freelancers/all?limit=8&minRating=4.0');
        if (response.ok) {
          const data = await response.json();
          setTopFreelancers(data.freelancers || []);
        } else {
          console.error('Failed to fetch freelancers');
        }
      } catch (error) {
        console.error('Error loading top freelancers:', error);
      } finally {
        setLoadingFreelancers(false);
      }
    };
    
    loadTopFreelancers();
  }, []);

  const handleTabChange = (tab: 'hire' | 'get-hired') => {
    setActiveTab(tab);
    setSearchQuery('');
  };

  const handleBrowse = () => {
    if (activeTab === 'hire') {
      if (isAuthenticated && isClient) {
        router.push('/client/post-job');
      } else {
        router.push('/register');
      }
    } else {
      if (isAuthenticated && isFreelancer) {
        router.push('/freelancer/browse-jobs');
      } else {
        router.push('/register');
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      if (activeTab === 'hire') {
        router.push(`/search/freelancers?q=${encodeURIComponent(searchQuery)}`);
      } else {
        router.push(`/freelancer/browse-jobs?q=${encodeURIComponent(searchQuery)}`);
      }
    } else {
      handleBrowse();
    }
  };

  const handleCategoryClick = (category: string) => {
    if (activeTab === 'hire') {
      router.push(`/search/freelancers?category=${encodeURIComponent(category)}`);
    } else {
      router.push(`/freelancer/browse-jobs?category=${encodeURIComponent(category)}`);
    }
  };

  return (
    <div className={manrope.className}>
      {/* Hero Section */}
      <section className="relative min-h-screen pt-24 lg:pt-32 pb-20 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-[#0CF574]/10" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#0CF574]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tab Navigation */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex bg-gray-100 rounded-full p-1.5">
              <button
                onClick={() => handleTabChange('hire')}
                className={`px-6 sm:px-10 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
                  activeTab === 'hire'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                HIRE TALENT
              </button>
              <button
                onClick={() => handleTabChange('get-hired')}
                className={`px-6 sm:px-10 py-3 rounded-full text-sm font-bold transition-all duration-300 ${
                  activeTab === 'get-hired'
                    ? 'bg-white text-gray-900 shadow-md'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                FIND WORK
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-[1.1] tracking-tight">
              {activeTab === 'hire' ? (
                <>
                  Find the perfect
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#0CF574] to-emerald-600">
                    freelance talent
                  </span>
                </>
              ) : (
                <>
                  Land your dream
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#0CF574] to-emerald-600">
                    freelance projects
                  </span>
                </>
              )}
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              {activeTab === 'hire' 
                ? "Connect with Nepal's top freelancers. Quality work, transparent pricing, and secure payments."
                : "Join thousands of freelancers earning from quality projects. Set your rates and work on your terms."}
            </p>

            {/* Search Box */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8">
              <div className="relative flex items-center bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <Search className="absolute left-5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={activeTab === 'hire' ? 'Search for skills (e.g., React, Logo Design)' : 'Search for projects (e.g., Website, App)'}
                  className="flex-1 pl-14 pr-4 py-4 text-base bg-transparent border-none focus:outline-none placeholder-gray-400"
                />
                <button 
                  type="submit"
                  className="m-2 px-6 py-3 bg-[#0CF574] text-gray-900 font-bold rounded-xl hover:bg-[#0CF574]/90 transition flex items-center gap-2"
                >
                  Search
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Popular Categories */}
            <div className="flex flex-wrap justify-center gap-2">
              <span className="text-sm text-gray-500 mr-2">Popular:</span>
              {['React', 'Logo Design', 'Content Writing', 'Video Editing'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleCategoryClick(tag)}
                  className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-600 hover:border-[#0CF574] hover:text-gray-900 transition"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Trusted By */}
            <div className="mt-16 pt-10 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-6">TRUSTED BY LEADING COMPANIES</p>
              <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
                {['Company 1', 'Company 2', 'Company 3', 'Company 4'].map((company, i) => (
                  <div key={i} className="text-xl font-bold text-gray-400">{company}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="w-8 h-8 text-[#0CF574] mx-auto mb-3" />
                <div className="text-3xl sm:text-4xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Browse by Category
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find the perfect freelancer or project across our popular categories
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => handleCategoryClick(category.name)}
                className="group p-6 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-xl border border-transparent hover:border-gray-200 transition-all duration-300"
              >
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">{category.name}</h3>
                <p className="text-xs text-gray-500">{category.jobs} jobs</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Freelancers Section */}
      {activeTab === 'hire' && (
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-12">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  Featured Freelancers
                </h2>
                <p className="text-gray-600">Top-rated professionals ready to work</p>
              </div>
              <button 
                onClick={() => router.push('/search/freelancers')}
                className="mt-4 sm:mt-0 px-6 py-3 border-2 border-gray-900 text-gray-900 font-semibold rounded-full hover:bg-gray-900 hover:text-white transition flex items-center gap-2"
              >
                View All
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loadingFreelancers ? (
                // Loading skeleton
                Array.from({ length: 8 }).map((_, idx) => (
                  <div key={idx} className="bg-white rounded-xl p-4 animate-pulse">
                    <div className="w-full h-40 bg-gray-200 rounded-lg mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))
              ) : topFreelancers.length > 0 ? (
                topFreelancers.map((freelancer) => (
                    <FreelancerCard
                      key={freelancer.id}
                      name={freelancer.profiles?.full_name || 'Unknown'}
                      username={`@${freelancer.username || 'unknown'}`}
                      avatar={freelancer.profiles?.avatar_url || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`}
                      status={freelancer.status || "offline"}
                      skills={freelancer.skills || []}
                      rating={freelancer.rating || 0}
                      onClick={() => router.push(`/freelancer/profile/${freelancer.id}`)}
                    />
                ))
              ) : (
                <div className="col-span-4 text-center py-12">
                  <p className="text-gray-600">No freelancers available at the moment.</p>
                  <button 
                    onClick={() => router.push('/register-freelancer')}
                    className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-black"
                  >
                    Become a Freelancer
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-[#0CF574]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How Neplancer Works
            </h2>
            <p className="text-gray-700 max-w-2xl mx-auto">
              Get started in just a few simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Post a Job', desc: 'Describe your project and the skills you need. Set your budget and timeline.' },
              { step: '02', title: 'Review Proposals', desc: 'Receive proposals from talented freelancers. Review profiles and portfolios.' },
              { step: '03', title: 'Hire & Collaborate', desc: 'Choose the best fit, collaborate seamlessly, and pay securely when satisfied.' },
            ].map((item, index) => (
              <div key={index} className="relative bg-white rounded-2xl p-8 shadow-lg">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gray-900 text-white rounded-xl flex items-center justify-center font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 mt-4">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Why choose Neplancer?
              </h2>
              <p className="text-gray-600 mb-8">
                We provide a secure and efficient platform for freelancers and clients to connect, collaborate, and grow together.
              </p>
              
              <div className="space-y-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-12 h-12 bg-[#0CF574]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-6 h-6 text-[#0CF574]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                      <p className="text-gray-600 text-sm">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-[#0CF574]/20 to-emerald-100 rounded-3xl p-8">
                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-[#0CF574] rounded-full flex items-center justify-center text-white font-bold">
                      JD
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">John Doe</div>
                      <div className="text-sm text-gray-500">Full Stack Developer</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-sm text-gray-600 ml-1">5.0 (48 reviews)</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['React', 'Node.js', 'TypeScript'].map((skill) => (
                      <span key={skill} className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to get started?
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Join thousands of freelancers and clients already using Neplancer to build amazing things together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/register"
              className="px-8 py-4 bg-[#0CF574] text-gray-900 font-bold rounded-full hover:bg-[#0CF574]/90 transition inline-flex items-center justify-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link 
              href="/search/freelancers"
              className="px-8 py-4 border-2 border-white text-white font-bold rounded-full hover:bg-white hover:text-gray-900 transition"
            >
              Browse Talent
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-semibold mb-4">For Clients</h4>
              <ul className="space-y-2">
                <li><Link href="/search/freelancers" className="text-gray-400 hover:text-white text-sm">Find Talent</Link></li>
                <li><Link href="/client/post-job" className="text-gray-400 hover:text-white text-sm">Post a Job</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm">How to Hire</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">For Freelancers</h4>
              <ul className="space-y-2">
                <li><Link href="/freelancer/browse-jobs" className="text-gray-400 hover:text-white text-sm">Find Work</Link></li>
                <li><Link href="/register" className="text-gray-400 hover:text-white text-sm">Create Profile</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm">Resources</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm">About Us</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm">Careers</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm">Privacy Policy</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm">Terms of Service</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm">Cookie Policy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 sm:mb-0">
              <div className="w-8 h-8 bg-[#0CF574] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <span className="text-white font-bold">Neplancer</span>
            </div>
            <p className="text-gray-500 text-sm">© 2026 Neplancer. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HeroSection;