'use client'

import React from 'react';
import { motion } from 'framer-motion';
import { BOOST_OPTIONS, type BoostType } from '@/lib/fantasyMockData';

interface BoostSelectorProps {
  active: BoostType;
  onToggle: (boost: BoostType) => void;
  deadlineLabel?: string;
  deadlineValue?: string;
  compact?: boolean;
}

export function BoostSelector({
  active,
  onToggle,
  deadlineLabel = "Gameweek 1 Transfer Deadline:",
  deadlineValue = "Sat 14 Feb, 14:30",
  compact = false,
}: BoostSelectorProps) {
  return (
    <section className={`w-full bg-[#1a1b23]/90 backdrop-blur-xl px-[16px] text-white flex flex-col items-center rounded-2xl border border-white/10 shadow-2xl ${compact ? 'py-[8px]' : 'py-[20px]'}`}>
      {/* Deadline Header — hidden in compact mode */}
      {!compact && (
        <div className="text-center mb-5">
          <h2 className="text-[14px] font-bold leading-[20px] tracking-tight text-white/90">
            {deadlineLabel}
          </h2>
          <p className="mt-[2px] text-[18px] font-bold leading-[24px] tracking-tight text-white">
            {deadlineValue}
          </p>
        </div>
      )}

      {/* Boost Cards Row */}
      <div className="flex items-start justify-center gap-[8px] w-full">
        {BOOST_OPTIONS.map((boost) => {
          const isActive = active === boost.id;

          let outerBgClass = 'bg-[#40424d]';
          let iconBgClass = 'bg-[#3b2b28]';
          let containerRadius = 'rounded-[12px]';
          let label = boost.label;

          if (boost.id === 'wildcard') label = 'Wilcard';
          else if (boost.id === 'freePlay') label = 'Free';

          const cardHeight = compact ? 'h-[68px]' : 'h-[105px]';

          return (
            <motion.div
              key={boost.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onToggle(isActive ? null : boost.id)}
              className={[
                `relative flex ${cardHeight} w-full min-w-[60px] flex-col items-center overflow-hidden cursor-pointer backdrop-blur-sm`,
                outerBgClass,
                containerRadius,
                isActive ? "ring-2 ring-[#ff6b00] z-10" : "border border-white/5"
              ].join(" ")}
            >
              <div
                className={[
                  `${compact ? 'mt-[8px]' : 'mt-[11px]'} flex items-center justify-center rounded-[8px] overflow-hidden`,
                  compact ? 'h-[24px] w-full px-2' : 'h-[38px] w-[38px]',
                  iconBgClass
                ].join(" ")}
              >
                <img
                  src="/images/upper.svg"
                  alt=""
                  aria-hidden="true"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="mt-[4px] px-1 text-center text-[9px] font-semibold leading-[11px] text-white/80">
                {label}
              </div>

              {!compact && (
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
