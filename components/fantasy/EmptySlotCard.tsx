'use client'

import React from 'react';
import { Plus } from 'lucide-react';

interface EmptySlotCardProps {
  onClick?: () => void;
  className?: string;
  position?: string;
}

export const EmptySlotCard: React.FC<EmptySlotCardProps> = ({ onClick, className = "", position }) => {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col w-[62px] sm:w-[76px] h-[100px] sm:h-[120px] rounded-xl overflow-hidden shadow-lg transition-all border border-white/10 relative group bg-white/5 backdrop-blur-md items-center justify-center active:scale-95 ${className}`}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 transition-colors">
        <Plus className="text-white w-5 h-5" />
      </div>
      
      {position && (
        <span className="absolute bottom-2 text-white/40 text-[9px] font-bold uppercase tracking-widest px-1">
          {position}
        </span>
      )}
    </button>
  );
};
