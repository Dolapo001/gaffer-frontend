'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { BOOST_OPTIONS, type BoostType } from '@/lib/fantasyMockData';

interface BoostSelectorProps {
  active: BoostType;
  onToggle: (boost: BoostType) => void;
  deadlineLabel?: string;
  deadlineValue?: string;
}

function TimerIcon({ active = false }: { active?: boolean }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M12.833 5.83325H15.1663"
        stroke="#FF7A00"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.0007 12.8333L15.7507 11.0833"
        stroke="#FF7A00"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="14.0003"
        cy="14.0001"
        r="7"
        stroke="#FF7A00"
        strokeWidth="1.6"
      />
    </svg>
  );
}

export function BoostSelector({ 
  active, 
  onToggle, 
  deadlineLabel = "Gameweek 1 Transfer Deadline:",
  deadlineValue = "Sat 14 Feb, 14:30" 
}: BoostSelectorProps) {
  return (
    <section className="w-full max-w-[340px] bg-[#000000] px-[10px] py-[10px] text-white flex flex-col items-center rounded-xl shadow-2xl">
      {/* Deadline Header - Matching your code's exact text styles */}
      <div className="text-center mb-3">
        <h2 className="text-[12px] font-extrabold leading-[16px] tracking-[-0.02em] text-white">
          {deadlineLabel}
        </h2>
        <p className="mt-[2px] text-[12px] font-extrabold leading-[16px] tracking-[-0.02em] text-white">
          {deadlineValue}
        </p>
      </div>

      {/* Boost Cards Row - Gap 4px matching your code */}
      <div className="flex items-start justify-center gap-[4px] w-full">
        {BOOST_OPTIONS.map((boost) => {
          const isActive = active === boost.id;
          
          // Maintaining the distinct colors from the reference image
          let outerBgClass = 'bg-[#747681]';
          let innerBgClass = 'bg-[#857670]';
          let containerRadius = 'rounded-none'; // Your code used rounded-none, though image is mixed. We'll follow your code.
          let showButton = true;
          let label = boost.label;

          if (boost.id === 'wildcard') {
            outerBgClass = 'bg-[#202230]';
            innerBgClass = 'bg-[#3B2B28]';
            containerRadius = 'rounded-none';
            label = 'Wilcard';
          } else if (boost.id === 'freePlay') {
            outerBgClass = 'bg-[#FFF0E6]';
            innerBgClass = 'bg-[#FFF0E6]';
            containerRadius = 'rounded-none';
            showButton = false;
            label = 'Free';
          }

          return (
            <motion.div
              key={boost.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => onToggle(isActive ? null : boost.id)}
              className={[
                "relative flex h-[95px] w-[74px] flex-col items-center overflow-hidden cursor-pointer",
                outerBgClass,
                containerRadius,
                isActive ? "ring-2 ring-[#ff6b00] z-10" : ""
              ].join(" ")}
            >
              {/* Icon Box - Exact padding from your code */}
              <div
                className={[
                  "mt-[10px] flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-[#FF69001A]",
                ].join(" ")}
              >
                <TimerIcon active={isActive} />
              </div>

              {/* Title - Exact styling from your code */}
              <div className="mt-[6px] px-0.5 text-center text-[10px] font-medium leading-[12px] text-[#94A3B8]">
                {label}
              </div>

              {/* Play Button - Exact dimensions and styles from your code */}
              {showButton ? (
                <button
                  type="button"
                  className={[
                    "mt-auto mb-[10px] h-[18px] w-[61px] rounded-[4px] border text-[10px] font-medium leading-none transition",
                    isActive ? "border-white bg-[#0B0B0F] text-white" : "border-white bg-transparent text-white"
                  ].join(" ")}
                >
                  Play
                </button>
              ) : (
                <div className="mt-auto mb-[10px] h-[18px]" />
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
