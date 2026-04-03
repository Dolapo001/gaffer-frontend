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
    <section className="w-full bg-transparent px-[4px] py-[10px] text-white flex flex-col items-center">
      {/* Deadline Header */}
      <div className="text-center mb-6">
        <h2 className="text-[16px] font-bold leading-[20px] tracking-tight text-white line-clamp-1">
          {deadlineLabel}
        </h2>
        <p className="mt-[2px] text-[18px] font-bold leading-[24px] tracking-tight text-white">
          {deadlineValue}
        </p>
      </div>

      {/* Boost Cards Row - Gap matching desired design */}
      <div className="flex items-start justify-center gap-[8px] w-full">
        {BOOST_OPTIONS.map((boost) => {
          const isActive = active === boost.id;
          
          // Consistency with desired design
          let outerBgClass = 'bg-[#40424d]';
          let iconBgClass = 'bg-[#3b2b28]';
          let containerRadius = 'rounded-[12px]'; 
          let showButton = true;
          let label = boost.label;

          if (boost.id === 'tripleCaptain') {
            outerBgClass = 'bg-[#40424d]';
            iconBgClass = 'bg-[#3b2b28]';
          } else if (boost.id === 'wildcard') {
            outerBgClass = 'bg-[#40424d]';
            iconBgClass = 'bg-[#3b2b28]';
            label = 'Wilcard';
          } else if (boost.id === 'freePlay') {
            outerBgClass = 'bg-[#40424d]';
            iconBgClass = 'bg-[#3b2b28]';
            showButton = true;
            label = 'Free';
          }

          return (
            <motion.div
              key={boost.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onToggle(isActive ? null : boost.id)}
              className={[
                "relative flex h-[105px] w-full min-w-[70px] flex-col items-center overflow-hidden cursor-pointer backdrop-blur-sm",
                outerBgClass,
                containerRadius,
                isActive ? "ring-2 ring-[#ff6b00] z-10" : "border border-white/5"
              ].join(" ")}
            >
              <div
                className={[
                  "mt-[11px] flex h-[38px] w-[38px] items-center justify-center rounded-[10px]",
                  iconBgClass
                ].join(" ")}
              >
                <TimerIcon active={isActive} />
              </div>

              {/* Title */}
              <div className="mt-[6px] px-1 text-center text-[10px] font-semibold leading-[12px] text-white/80">
                {label}
              </div>

              {showButton && (
                <button
                  type="button"
                  className={[
                    "mt-auto mb-[10px] h-[20px] w-[85%] rounded-[6px] border border-white bg-transparent text-[10px] font-bold leading-none text-white transition hover:bg-white/10",
                    isActive ? "bg-white/20" : ""
                  ].join(" ")}
                >
                  Play
                </button>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
