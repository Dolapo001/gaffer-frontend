'use client'

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SaveTeamConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const SaveTeamConfirmationModal: React.FC<SaveTeamConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-6"
        >
          {/* Backdrop with blur */}
          <div className="absolute inset-0 bg-[#0f172a]/80 backdrop-blur-md" onClick={onClose} />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-[#1b1c28] w-full max-w-[327px] rounded-[32px] p-8 flex flex-col items-center shadow-2xl border border-white/5"
          >
            <h2 className="text-white text-[32px] font-bold mb-4 tracking-tight">Last chance !</h2>
            <p className="text-white/80 text-[16px] text-center mb-10 leading-relaxed font-medium">
              Are you sure you want to save your<br />Team ?
            </p>
            
            <div className="flex gap-4 w-full">
              <button
                onClick={onClose}
                className="flex-1 h-[56px] rounded-2xl border border-white/20 text-white font-bold text-[16px] active:scale-95 transition-all"
              >
                Back
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 h-[56px] rounded-2xl bg-gradient-to-r from-[#ff4d00] to-[#ff8a00] text-white font-bold text-[16px] shadow-[0_8px_20px_rgba(255,77,0,0.3)] active:scale-95 transition-all"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
