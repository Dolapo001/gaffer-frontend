'use client';

import { ChevronRight } from 'lucide-react';

export function TopAssiterButton() {
  return (
    <div className="w-full flex justify-center px-4">
      <button 
        className="hover:bg-white/[0.04] flex items-center justify-between px-6 transition-all group shrink-0"
        style={{ 
          width: '302.25px', 
          height: '45px', 
          borderRadius: '12px',
          backgroundColor: '#1a1b2e',
          border: '1.31px solid #2E2F3E',
          fontFamily: "'Poppins', sans-serif"
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[17px] font-bold tracking-tight text-white">Top Assiter</span>
          <ChevronRight size={18} className="text-white group-hover:translate-x-1 transition-transform" />
        </div>
      </button>
    </div>
  );
}
