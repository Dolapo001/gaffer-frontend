'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface FantasyWelcomeProps {
  onGetStarted: () => void;
}

export const FantasyWelcome: React.FC<FantasyWelcomeProps> = ({ onGetStarted }) => {
  const router = useRouter();
  const [isExiting, setIsExiting] = React.useState(false);

  const handleGetStarted = () => {
    setIsExiting(true);
    // 300ms Ease-Out Dissolve Animation out 
    setTimeout(() => {
      onGetStarted();
    }, 300);
  };

  return (
    <div 
      className={`fixed inset-0 w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto bg-[#222232] overflow-hidden flex flex-col z-0 transition-opacity duration-300 ease-out ${isExiting ? 'opacity-0' : 'opacity-100'}`}
      style={{ fontFamily: "'Chakra Petch', sans-serif" }}
    >
      
      {/* Background Image Overlay - Maximum visibility */}
      <div 
        className="absolute inset-0 z-0 opacity-100 bg-cover bg-center transition-opacity duration-300 ease-out"
        style={{ backgroundImage: 'url("/images/fantasy_bg.png")' }} 
      />
      
      {/* Soft Cinematic Gradient for visibility */}
      <div 
        className="absolute inset-0 z-0" 
        style={{ 
          background: 'linear-gradient(to bottom, transparent 0%, rgba(34, 34, 50, 0.4) 30%, rgba(34, 34, 50, 0.9) 100%)' 
        }} 
      />

      {/* Content Container - Locked Viewport Layout */}
      <div className="relative z-10 w-full h-full flex flex-col px-6 touch-none">
        {/* Top Content: Linked to Design Coordinates */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 0.3, ease: "easeOut" }} // Match Dissolve spec
           className="pt-[132px]"
        >
          {/* Welcome Title */}
          <h1 className="text-white font-bold text-[20px] leading-none mb-[20px] tracking-tight">
            Welcome to Fantasy
          </h1>
          
          {/* Description Text */}
          <p className="text-white/90 font-normal text-[14px] leading-[140%] max-w-[283px]">
            Create your team, make transfer and become the GAFFER who tops the Leaderboard.
          </p>
        </motion.div>

        {/* Dynamic Spacer to push button down */}
        <div className="flex-1" />

        {/* Bottom Button: Anchored above navigation */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }} // Match Dissolve spec
          className="pb-[180px] flex justify-center w-full"
        >
          <button
            onClick={handleGetStarted}
            className="w-full max-w-[312px] h-[52px] bg-white text-[#181928] font-bold text-base rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] active:scale-95 transition-all flex items-center justify-center"
          >
            Get Started
          </button>
        </motion.div>
      </div>
    </div>
  );
};
