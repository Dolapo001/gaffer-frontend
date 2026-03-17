'use client'

import React from 'react';
import { motion } from 'framer-motion';

interface FantasyWelcomeProps {
  onGetStarted: () => void;
}

export const FantasyWelcome: React.FC<FantasyWelcomeProps> = ({ onGetStarted }) => {
  return (
    <div 
      className="w-full max-w-sm mx-auto h-screen bg-[#181928] relative overflow-hidden flex flex-col"
      style={{ fontFamily: "'Chakra Petch', sans-serif" }}
    >
      
      {/* Background Image Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-60 bg-cover bg-center transition-opacity duration-1000"
        style={{ backgroundImage: 'url("/images/fantasy_bg.png")' }} 
      />
      {/* Cinematic Gradient Vignette */}
      <div 
        className="absolute inset-0 z-0" 
        style={{ 
          background: 'radial-gradient(circle at top, transparent 0%, rgba(15, 23, 43, 0.4) 40%, rgba(15, 23, 43, 0.9) 100%)' 
        }} 
      />

      {/* Content */}
      <div className="relative z-10 flex-1 px-4">
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ duration: 1 }}
        >
          {/* Welcome Title */}
          <h1 
            style={{ 
              position: 'absolute',
              top: '132px',
              left: '16px',
              width: '193px',
              height: '26px',
              fontWeight: 700,
              fontSize: '20px',
              lineHeight: '100%',
              margin: 0,
              color: 'white'
            }}
          >
            Welcome to Fantasy
          </h1>
          
          {/* Description Text */}
          <p 
            style={{ 
              position: 'absolute',
              top: '178px',
              left: '16px',
              width: '283px',
              height: '54px',
              fontWeight: 400,
              fontSize: '14px',
              lineHeight: '130%', // Adjusted slightly from 100% for better readability while respecting user's height
              color: 'white',
              margin: 0,
              opacity: 0.9
            }}
          >
            Create your team, make transfer and become the GAFFER who tops the Leaderboard.
          </p>

          {/* Get Started Button */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onGetStarted}
            className="w-[312px] h-[52px] bg-white text-black font-bold text-base rounded-xl shadow-lg transition-all absolute"
            style={{
              left: '50%',
              transform: 'translateX(-50%)',
              bottom: '180px' // Avoiding the bottom nav
            }}
          >
            Get Started
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};
