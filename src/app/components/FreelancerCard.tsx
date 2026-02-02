import React from 'react';
import { Star, MapPin, Clock, CheckCircle2 } from "lucide-react";
import Image from 'next/image';

interface FreelancerCardProps {
  name: string;
  username: string;
  avatar: string;
  status: 'online' | 'offline' | 'connecting';
  skills: string[];
  rating: number;
  onClick?: () => void;
}

export function FreelancerCard({ 
  name, 
  username, 
  avatar, 
  status, 
  skills, 
  rating,
  onClick 
}: FreelancerCardProps) {
  // Calculate status display
  const getStatusConfig = () => {
    switch (status) {
      case 'online':
        return { text: 'Available', animated: true };
      case 'connecting':
        return { text: 'Busy', animated: true };
      case 'offline':
        return { text: 'Offline', animated: false };
      default:
        return { text: 'Away', animated: false };
    }
  };

  const statusConfig = getStatusConfig();
  const displaySkills = skills.slice(0, 3);

  return (
    <div className="w-full h-full" onClick={onClick}>
      <div className="group relative w-full bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-gray-200">
        
        {/* Verified Badge - Top Left */}
        <div className="absolute top-2 left-2 z-10">
          <div className="bg-gray-900 text-white rounded-lg px-2 py-1 shadow-md flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span className="text-[10px] font-semibold">VERIFIED</span>
          </div>
        </div>

        {/* Rating Badge - Top Right */}
        <div className="absolute top-2 right-2 z-10">
          <div className="bg-white/95 backdrop-blur-sm text-gray-900 rounded-lg px-2.5 py-1 shadow-md border border-gray-200">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-gray-900 text-gray-900" />
              <span className="text-xs font-bold">{rating.toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Main Image with Overlay Effect */}
        <div className="relative w-full h-40 bg-gray-200 overflow-hidden">
          <Image 
            width={400} 
            height={300}
            src={avatar}
            alt={`${name}'s profile`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          {/* Subtle Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        {/* Content Section */}
        <div className="bg-white p-4">
          
          {/* Name and Title with Status Indicator */}
          <div className="mb-3">
            <div className="flex items-start justify-between mb-1.5">
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-gray-900 mb-0.5 tracking-tight leading-tight group-hover:text-gray-700 transition-colors duration-300 truncate">
                  {name}
                </h2>
                <p className="text-xs text-gray-500 font-medium truncate">{username}</p>
              </div>
              <div className={`flex items-center gap-1 ${
                status === 'online' ? 'text-gray-900 bg-gray-100' :
                status === 'connecting' ? 'text-gray-700 bg-gray-50' :
                'text-gray-400 bg-gray-50'
              } px-2 py-0.5 rounded-full flex-shrink-0 ml-2`}>
                <div className={`w-1.5 h-1.5 ${
                  status === 'online' ? 'bg-gray-900' :
                  status === 'connecting' ? 'bg-gray-600' :
                  'bg-gray-400'
                } rounded-full ${statusConfig.animated ? 'animate-pulse' : ''}`}></div>
                <span className="text-[10px] font-semibold">{statusConfig.text}</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-2.5 text-[10px] text-gray-500 mb-2.5">
              <div className="flex items-center gap-0.5">
                <MapPin className="w-3 h-3" />
                <span>Nepal</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Clock className="w-3 h-3" />
                <span>Fast Reply</span>
              </div>
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-gray-900" />
                <span className="text-gray-900 font-semibold">Top Rated</span>
              </div>
            </div>
          </div>
          
          {/* Skills Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {displaySkills.map((skill, index) => (
              <span 
                key={index}
                className="bg-gray-100 text-gray-700 text-[10px] font-semibold px-2.5 py-1 rounded-full border border-gray-200"
              >
                {skill}
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-1.5">
            <button className="flex-1 bg-gray-900 hover:bg-black text-white text-xs font-bold py-2.5 rounded-lg transition-all duration-200 hover:shadow-lg active:scale-[0.98]">
              Hire Now
            </button>
            <button className="px-3 bg-white border-2 border-gray-200 hover:border-gray-900 text-gray-700 hover:text-gray-900 text-xs font-semibold rounded-lg transition-all duration-200 hover:shadow-md active:scale-[0.98]">
              View
            </button>
          </div>

          {/* Hourly Rate Indicator */}
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-[10px] text-gray-500 font-medium">Starting at</span>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-bold text-gray-900">$35</span>
              <span className="text-[10px] text-gray-500">/hr</span>
            </div>
          </div>
        </div>

        {/* Subtle Hover Effect */}
        <div className="absolute inset-0 rounded-xl bg-gray-900/0 group-hover:bg-gray-900/[0.02] pointer-events-none transition-all duration-300"></div>
      </div>
    </div>
  );
}