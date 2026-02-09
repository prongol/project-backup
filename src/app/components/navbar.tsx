"use client"
import React, { useState, useRef, useEffect } from "react";
import { Krona_One, Manrope } from "next/font/google";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/NotificationBell";

const kronaOne = Krona_One({
  subsets: ["latin"],
  weight: ["400"],
  style: "normal",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: "normal",
});

interface DropdownSection {
  title: string;
  description: string;
}

interface DropdownContent {
  title: string;
  icon: string;
  sections: DropdownSection[];
  footer?: {
    title: string;
    description: string;
  };
}

const Navbar = () => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, signOut } = useAuth();
  const isAuthenticated = !!user;
  const isClient = user?.role === 'client';
  const isFreelancer = user?.role === 'freelancer';
  const router = useRouter();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = async () => {
    try {
      setShowUserMenu(false);
      // signOut will handle the redirect and cleanup
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
      // Force reload on error
      window.location.href = '/';
    }
  };

  const independentsContent = {
    title: "GROW YOUR CAREER",
    icon: "😊",
    sections: [
      {
        title: "Manage freelance projects",
        description: "Let Neplancer handle the admin, so you can focus on what you do best"
      },
      {
        title: "Get verified as an expert",
        description: "Grow your reputation getting verified by your favorite tools"
      }
    ],
    footer: {
      title: "Supercharge your earnings with Neplancer Pro",
      description: "Our most powerful tools to build your career on your terms"
    }
  };

  const companiesContent = {
    title: "GET DISCOVERED",
    icon: "🔍",
    sections: [
      {
        title: "Find jobs",
        description: "Explore opportunities from the world's most innovative companies"
      },
      {
        title: "Get discovered",
        description: "Get featured on Neplancer's network of expert talent"
      }
    ]
  };

  const invoiceContent = {
    title: "INVOICE AND BILL CLIENTS",
    icon: "💰",
    sections: [
      {
        title: "Sign contracts",
        description: "Compliant & custom contracts"
      },
      {
        title: "Send invoices",
        description: "All your client invoices in one place"
      },
      {
        title: "Commission-free payments",
        description: "Keep 94% of what you earn"
      }
    ]
  };

  const getDropdownContent = (item: string) => {
    switch (item) {
      case "Independents":
        return independentsContent;
      case "Companies":
        return companiesContent;
      case "Creator tools":
        return invoiceContent;
      default:
        return null;
    }
  };

  const renderDropdown = (content: DropdownContent | null) => {
    if (!content) return null;

    return (
      <div className="absolute top-full left- w-full bg-white shadow-lg z-50 py-8">
        <div className={`${manrope.className} max-w-7xl mx-auto px-8`}>
          <div className="grid grid-cols-3 gap-8">
            {/* First Column */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                {/* <span className="text-lg">{content.icon}</span> */}
                  <span className="bg-[#0CF574]/80 py-1 px-3 rounded-2xl text-sm font-semibold text-foreground tracking-wide">{content.title}</span>
              </div>
              {content.sections.map((section: DropdownSection, index: number) => (
                <div key={index} className="mb-6">
                  <h3 className="font-semibold text-foreground mb-2">{section.title}</h3>
                  <Link href={""} className="text-gray-600 text-sm leading-relaxed">{section.description}</Link>
                </div>
              ))}
            </div>

            {/* Second Column - Additional content could go here */}
            <div></div>

            {/* Third Column - Pro section */}
            {content.footer && (
              <div>
                <div className="flex items-center gap-2 mb-6 ">
                  {/* <span className="text-lg">💰</span> */}
                  <span className="bg-[#0CF574]/80 py-1 px-3 rounded-2xl text-sm font-semibold text-gray-800 tracking-wide">INVOICE AND BILL CLIENTS</span>
                </div>
                {invoiceContent.sections.map((section: DropdownSection, index: number) => (
                  <div key={index} className="mb-4">
                    <h3 className="font-semibold text-gray-900 mb-1">{section.title}</h3>
                    <p className="text-gray-600 text-sm">{section.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Pro Section */}
          {content.footer && (
            <div className="mt-8 pt-6">
              <div className="flex items-center justify-between bg-gray-100 hover:bg-[#3cf790] hover:text-2xl transition-all duration-400 cursor-pointer rounded-lg p-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{content.footer.title}</h3>
                  <p className="text-gray-600 text-sm">{content.footer.description}</p>
                </div>
                <div className="flex items-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="sticky top-0 z-50">
      <nav className="w-full bg-white px-18 py-3 flex items-center justify-between relative z-10 border-b border-gray-100">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold flex items-center gap-2 select-none">
            <Link className={`${kronaOne.className} font-bold`} href="/">Neplancer</Link>
          </span>
        </div>

        {/* Nav Links */}
        <div className={`${manrope.className} hidden md:flex gap-8 text-base font-semibold text-gray-800`}>
          {!isAuthenticated ? (
            // Public navigation
            ["Independents", "Companies", "Creator tools"].map((item) => (
              <a
                key={item}
                href="#"
                className="hover:text-black/30 transition py-2"
                onMouseEnter={() => setHoveredItem(item)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {item}
              </a>
            ))
          ) : (
            // Authenticated navigation
            <>
              <Link href="/dashboard" className="hover:text-black/30 transition py-2">
                Dashboard
              </Link>
              
              {isFreelancer && (
                <>
                  <Link href="/freelancer/browse-jobs" className="hover:text-black/30 transition py-2">
                    Browse Jobs
                  </Link>
                  <Link href="/freelancer/my-proposals" className="hover:text-black/30 transition py-2">
                    My Proposals
                  </Link>
                </>
              )}
              
              {isClient && (
                <>
                  <Link href="/client/post-job" className="hover:text-black/30 transition py-2">
                    Post a Job
                  </Link>
                  <Link href="/client/jobs" className="hover:text-black/30 transition py-2">
                    My Jobs
                  </Link>
                </>
              )}
              
              <Link href="/communication" className="hover:text-black/30 transition py-2">
                Messages
              </Link>
              <Link href="/contracts" className="hover:text-black/30 transition py-2">
                Contracts
              </Link>
            </>
          )}
        </div>

        {/* CTA Buttons / User Menu */}
        <div className={`${manrope.className} flex items-center gap-4`}>
          {!isAuthenticated ? (
            // Not logged in - show signup/login
            <>
              <Link 
                href="/register" 
                className="px-6 py-2 rounded-full bg-foreground text-white font-semibold hover:bg-gray-800 cursor-pointer transition-colors duration-200"
              >
                Sign up
              </Link>
              <Link 
                href="/login" 
                className="text-gray-900 font-semibold hover:text-gray-600 transition-colors duration-200"
              >
                Log in
              </Link>
            </>
          ) : (
            // Logged in - show notifications + user menu
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <NotificationBell />
              
              {/* User Menu */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 px-3 py-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                >
                  <Avatar className="w-10 h-10 border-2 border-[#0CF574]/30">
                    <AvatarImage 
                      src={user?.avatarUrl || ''} 
                      alt={user?.name || 'User'} 
                    />
                    <AvatarFallback className="bg-[#0CF574] text-foreground font-bold text-base">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <svg 
                    className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                  {/* User Info Header */}
                  <div className="px-4 py-4 bg-gradient-to-br from-[#0CF574]/10 to-white border-b border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-12 h-12 border-2 border-[#0CF574]/50">
                        <AvatarImage 
                          src={user?.avatarUrl || ''} 
                          alt={user?.name || 'User'} 
                        />
                        <AvatarFallback className="bg-[#0CF574] text-foreground font-bold text-lg">
                          {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-[#0CF574]/30 text-foreground rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        {user?.role === 'client' ? 'Client' : 'Freelancer'}
                      </span>
                      <Link 
                        href={isFreelancer ? `/freelancer/profile/${user?.id}` : `/client/profile`}
                        className="text-xs font-semibold text-[#0CF574] hover:text-[#0CF574]/80 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        View Profile →
                      </Link>
                    </div>
                  </div>

                  {/* Profile Stats Section */}
                  {isFreelancer && (
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-lg font-bold text-gray-900">{user?.stats?.completedJobs || 0}</p>
                          <p className="text-xs text-gray-500">Jobs Done</p>
                        </div>
                        <div className="border-l border-r border-gray-300">
                          <p className="text-lg font-bold text-gray-900">${user?.stats?.totalEarnings || 0}</p>
                          <p className="text-xs text-gray-500">Earned</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-900">{user?.stats?.rating || '5.0'}</p>
                          <p className="text-xs text-gray-500">Rating</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {isClient && (
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div>
                          <p className="text-lg font-bold text-gray-900">{user?.stats?.jobsPosted || 0}</p>
                          <p className="text-xs text-gray-500">Jobs Posted</p>
                        </div>
                        <div className="border-l border-gray-300">
                          <p className="text-lg font-bold text-gray-900">${user?.stats?.totalSpent || 0}</p>
                          <p className="text-xs text-gray-500">Total Spent</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Navigation Links */}
                  <div className="py-2">
                    <Link 
                      href="/dashboard" 
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Dashboard
                    </Link>
                    
                    {/* Admin Dashboard Link - Only show if user is admin */}
                    {user?.is_admin && (
                      <Link 
                        href="/admin/dashboard" 
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors border-l-4 border-purple-500"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span className="font-semibold">Admin Dashboard</span>
                      </Link>
                    )}
                    
                    {isFreelancer && (
                      <>
                        <Link 
                          href="/freelancer/browse-jobs" 
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Browse Jobs
                        </Link>
                        <Link 
                          href="/freelancer/my-proposals" 
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          My Proposals
                        </Link>
                      </>
                    )}
                    
                    {isClient && (
                      <>
                        <Link 
                          href="/client/post-job" 
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Post a Job
                        </Link>
                        <Link 
                          href="/client/jobs" 
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          My Jobs
                        </Link>
                      </>
                    )}
                    
                    <Link 
                      href="/communication" 
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                      Messages
                    </Link>
                    <Link 
                      href="/contracts" 
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Contracts
                    </Link>
                  </div>
                  
                  {/* Settings & Logout */}
                  <div className="border-t border-gray-200 py-2">
                    <Link 
                      href="/settings" 
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          )}
        </div>
      </nav>

      {/* Dropdown Menu */}
      {hoveredItem && (
        <div
          onMouseEnter={() => setHoveredItem(hoveredItem)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          {renderDropdown(getDropdownContent(hoveredItem))}
        </div>
      )}
    </div>
  );
};


export default Navbar;
