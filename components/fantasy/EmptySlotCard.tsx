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
      style={{
        width: '64px',
        height: '102px',
        borderRadius: '5.45px',
        border: '0.4px solid rgba(255, 255, 255, 0.45)',
        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(55, 0, 60, 0.25) 100%)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0px 1.02px 1.7px 0px rgba(0, 0, 0, 0.1), inset 0 0 10px rgba(255,255,255,0.05)',
      }}
      className={`flex flex-col items-center justify-center transition-all active:scale-95 group overflow-hidden ${className}`}
    >
      <Plus className="text-white w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
    </button>
  );
};
