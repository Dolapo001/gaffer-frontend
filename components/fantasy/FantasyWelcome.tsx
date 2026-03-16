'use client'

import React from 'react';
import { motion } from 'framer-motion';

interface FantasyWelcomeProps {
  onGetStarted: () => void;
}

export const FantasyWelcome: React.FC<FantasyWelcomeProps> = ({ onGetStarted }) => {
  return (
    <div className="w-full max-w-sm mx-auto h-screen bg-[#181928] relative overflow-hidden flex flex-col font-sans">
      
      {/* Background Image Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-60 bg-cover bg-center"
        style={{ backgroundImage: 'url("/assets/bg/fantasy-main-bg.png")' }} 
      />
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#181928]/40 via-[#181928]/80 to-[#181928]" />

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-8 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-white text-[32px] font-bold leading-tight mb-4">
            Welcome to Fantasy
          </h1>
          
          <p className="text-white/80 text-base leading-relaxed mb-12 max-w-[280px]">
            Create your team, make transfer and become the GAFFER who tops the Leaderboard.
          </p>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onGetStarted}
            className="w-full bg-white text-black font-bold py-4 rounded-xl shadow-lg hover:bg-gray-100 transition-colors"
          >
            Get Started
          </motion.button>
        </motion.div>
      </div>

      {/* Note: The bottom nav is handled by the parent layout */}
    </div>
  );
};
