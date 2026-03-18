'use client'

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/store/toastStore';

const FantasyDashboard: React.FC = () => {
  const router = useRouter();
  const { addToast } = useToast();

  const handleNav = (label: string, path: string) => {
    if (path === '/app/fantasy/transfers') {
      addToast('Transfers will be available soon!', 'warning');
      return;
    }
    router.push(path);
  };

  return (
    <div className="fixed inset-0 w-full max-w-sm mx-auto bg-[#222232] overflow-hidden flex flex-col font-sans z-0">
      
      {/* Background Image Overlay - Maximum visibility */}
      <div 
        className="absolute inset-0 z-0 opacity-100 bg-cover bg-center transition-opacity duration-1000"
        style={{ backgroundImage: 'url("/images/fantasy_bg.png")' }} 
      />
      {/* Super-soft gradient for maximum image clarity */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-[#222232]/30 to-[#222232]/80" />

      {/* Main Content Area */}
      <div className="relative z-10 w-full h-full touch-none">
        
        {/* Points Card (Enhanced Glass) */}
        <div 
          className="absolute backdrop-blur-lg border border-white/5 shadow-2xl overflow-hidden flex flex-col items-center py-5"
          style={{ 
            width: '342px', 
            height: '160px', 
            top: '59px', 
            left: '50%',
            transform: 'translateX(-50%)',
            borderRadius: '24px',
            backgroundColor: 'rgba(34, 34, 50, 0.6)', // Increased transparency for better BG visibility
            fontFamily: "'Chakra Petch', sans-serif"
          }}
        >
          {/* Subtle inner gloss */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
          
          <h2 className="text-white text-center text-[16px] font-bold mb-4 uppercase tracking-widest">Round 1 Points</h2>
          
          <div className="flex justify-around w-full px-4 relative z-10">
            {/* Average */}
            <div className="flex flex-col items-center">
              <span className="text-white text-[36px] font-bold leading-none mb-1">34</span>
              <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Average</span>
            </div>
            
            {/* Your Score */}
            <div className="flex flex-col items-center scale-110">
              <span className="text-[#FF4D00] text-[52px] font-bold leading-none mb-0.5 drop-shadow-[0_0_15px_rgba(255,77,0,0.3)]">114</span>
              <span className="text-white text-[11px] font-bold uppercase tracking-widest">Your Score</span>
            </div>
            
            {/* Highest */}
            <div className="flex flex-col items-center">
              <span className="text-white text-[36px] font-bold leading-none mb-1">132</span>
              <span className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Highest</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu (Enhanced Glass) */}
        <div 
          className="absolute w-full px-4"
          style={{ top: '0', left: '0' }}
        >
          {[
            { label: 'Points', path: '/app/fantasy/points', top: 240 },
            { label: 'Pick Team', path: '/app/fantasy/team', top: 312 },
            { label: 'Transfers', path: '/app/fantasy/transfers', top: 384 }
          ].map((item) => (
            <button 
              key={item.label}
              className="absolute flex items-center bg-[#2b2b40]/70 backdrop-blur-md transition-all hover:bg-[#32324d]/80 active:scale-[0.98] group"
              style={{ 
                width: '342px', 
                height: '56px', 
                top: `${item.top}px`, 
                left: '50%',
                transform: 'translateX(-50%)',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
              }}
              onClick={() => handleNav(item.label, item.path)}
            >
              <span className="text-white font-bold text-[16px] ml-[20px] uppercase tracking-wide">{item.label}</span>
              
              {/* Chevron Circle Icon */}
              <div 
                className="absolute flex items-center justify-center rounded-full border border-white/40 group-hover:border-white transition-all transform group-hover:translate-x-1"
                style={{ 
                  width: '24px',
                  height: '24px',
                  top: '16px',
                  right: '20px'
                }}
              >
                <ChevronRight size={14} strokeWidth={2.5} className="text-white" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FantasyDashboard;
