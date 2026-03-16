'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Home, Users, Trophy, Newspaper } from 'lucide-react';

// --- Types ---
interface StandingRow {
  name: string;
  w: number;
  d: number;
  l: number;
  pts: number;
  status: 'qualified' | 'playoffs' | 'none';
}

interface ScorerRow {
  name: string;
  goals: number;
  avatar: string;
}

// --- Hardcoded data (exactly as screenshot) ---
const standings: StandingRow[] = [
  { name: 'COCCS', w: 3, d: 0, l: 0, pts: 9, status: 'qualified' },
  { name: 'COHES', w: 2, d: 1, l: 0, pts: 7, status: 'qualified' },
  { name: 'COSMS', w: 2, d: 1, l: 0, pts: 7, status: 'qualified' },
  { name: 'COLAW', w: 1, d: 2, l: 0, pts: 5, status: 'qualified' },
  { name: 'COAES', w: 1, d: 1, l: 1, pts: 4, status: 'playoffs' },
];

const topScorers: ScorerRow[] = [
  { name: 'Omoba',  goals: 9, avatar: 'https://i.pravatar.cc/32?u=omoba'  },
  { name: 'Dahood', goals: 6, avatar: 'https://i.pravatar.cc/32?u=dahood' },
  { name: 'Kola',   goals: 4, avatar: 'https://i.pravatar.cc/32?u=kola'   },
  { name: 'Choco',  goals: 4, avatar: 'https://i.pravatar.cc/32?u=choco'  },
  { name: 'Wisdom', goals: 3, avatar: 'https://i.pravatar.cc/32?u=wisdom' },
  { name: 'Toberu', goals: 3, avatar: 'https://i.pravatar.cc/32?u=toberu' },
];

function StatusDot({ status }: { status: StandingRow['status'] }) {
  if (status === 'qualified') return <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />;
  if (status === 'playoffs')  return <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />;
  return <span className="w-2 h-2 rounded-full bg-transparent inline-block" />;
}

export default function LeagueDashboard() {
  const [activeTab, setActiveTab] = useState<'table' | 'fixtures'>('table');

  return (
    <div className="max-w-[390px] mx-auto bg-[#0A0A0A] min-h-screen relative flex flex-col font-sans">

      {/* ── Status bar simulation ── */}
      <div className="flex items-center justify-between px-5 pt-2 pb-1">
        <span className="text-white text-xs font-semibold">9:41</span>
        <div className="flex items-center gap-1.5">
          {/* Signal bars */}
          <svg width="17" height="12" viewBox="0 0 17 12" fill="white">
            <rect x="0"  y="6"  width="3" height="6" rx="0.5"/>
            <rect x="4"  y="4"  width="3" height="8" rx="0.5"/>
            <rect x="8"  y="2"  width="3" height="10" rx="0.5"/>
            <rect x="12" y="0"  width="3" height="12" rx="0.5"/>
          </svg>
          {/* WiFi */}
          <svg width="16" height="12" viewBox="0 0 16 12" fill="white">
            <path d="M8 9.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3z"/>
            <path d="M8 6C5.79 6 3.8 6.92 2.34 8.4L3.76 9.82A5.96 5.96 0 018 7.98c1.66 0 3.16.67 4.24 1.76l1.42-1.42A7.96 7.96 0 008 6z"/>
            <path d="M8 2C4.65 2 1.63 3.4 0 5.7L1.44 7.14A9.95 9.95 0 018 4c2.76 0 5.26 1.12 7.07 2.93L16.5 5.49A11.95 11.95 0 008 2z" opacity="0.6"/>
          </svg>
          {/* Battery */}
          <svg width="25" height="12" viewBox="0 0 25 12" fill="white">
            <rect x="0" y="1" width="21" height="10" rx="2" stroke="white" strokeWidth="1" fill="none"/>
            <rect x="1.5" y="2.5" width="17" height="7" rx="1" fill="white"/>
            <path d="M22 4v4a2 2 0 000-4z"/>
          </svg>
        </div>
      </div>

      {/* ── Header ── */}
      <div className="flex flex-col items-center pt-1 pb-3 px-4">
        {/* Premier League Logo */}
        <div className="mb-1">
          <Image
            src="https://upload.wikimedia.org/wikipedia/en/f/f2/Premier_League_Logo.svg"
            alt="Premier League"
            width={28}
            height={28}
            priority
            unoptimized
          />
        </div>
        <h1 className="text-white font-bold tracking-tight" style={{ fontSize: '18px', lineHeight: '1.2' }}>
          BOWEN FANS LEAGUES
        </h1>
      </div>

      {/* ── Live Match Section ── */}
      <div className="px-4 mb-4">
        <div className="flex gap-2">

          {/* Live match card - exact gradient from screenshot */}
          <div
            className="flex-1 rounded-2xl p-3 relative overflow-hidden"
            style={{ background: 'linear-gradient(90deg, #6B46C1 0%, #EC4899 100%)', minHeight: '155px' }}
          >
            {/* LIVE MATCH pill */}
            <div className="absolute top-2.5 left-0 right-0 flex justify-center">
              <span className="bg-white/20 text-white text-[10px] font-semibold px-3 py-0.5 rounded-full tracking-wide backdrop-blur-sm border border-white/30">
                LIVE MATCH
              </span>
            </div>

            {/* Teams row */}
            <div className="flex items-center justify-between mt-7 px-1">
              {/* Barcelona crest */}
              <div className="flex flex-col items-center">
                <Image
                  src="https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg"
                  alt="FC Barcelona"
                  width={44}
                  height={44}
                  unoptimized
                />
              </div>

              {/* Score */}
              <span className="text-white font-bold" style={{ fontSize: '40px', lineHeight: '1', letterSpacing: '-1px' }}>
                2 - 2
              </span>

              {/* Man City crest */}
              <div className="flex flex-col items-center">
                <Image
                  src="https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg"
                  alt="Manchester City"
                  width={44}
                  height={44}
                  unoptimized
                />
              </div>
            </div>

            {/* Scorers row */}
            <div className="flex justify-between mt-2 px-1">
              <div className="flex flex-col gap-0.5">
                <span className="text-white/90 text-[10px]">De Jong 66&apos;</span>
                <span className="text-white/90 text-[10px]">Depay 79&apos;</span>
              </div>
              <div className="flex flex-col gap-0.5 items-end">
                <span className="text-white/90 text-[10px]">Alvarez 21&apos;</span>
                <span className="text-white/90 text-[10px]">Palmer 70&apos;</span>
              </div>
            </div>
          </div>

          {/* Brighton/Samuel side card */}
          <div
            className="w-[78px] rounded-2xl flex flex-col items-center justify-center gap-1.5"
            style={{ background: '#1A1A2E', minHeight: '155px' }}
          >
            {/* Circular club placeholder */}
            <div className="w-11 h-11 rounded-full bg-[#2A2A4A] border border-white/20 flex items-center justify-center overflow-hidden">
              {/* Brighton stripes placeholder */}
              <div className="w-full h-full rounded-full" style={{
                background: 'repeating-linear-gradient(90deg, #0057B8 0px, #0057B8 5px, white 5px, white 10px)'
              }} />
            </div>
            <span className="text-white text-[10px] font-medium text-center leading-tight">
              Samuel 40&apos;
            </span>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="px-4 mb-3">
        <div className="flex border-b border-[#2A2A2A]">
          <button
            onClick={() => setActiveTab('table')}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'table'
                ? 'text-white border-b-2 border-white -mb-px'
                : 'text-gray-500'
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setActiveTab('fixtures')}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === 'fixtures'
                ? 'text-white border-b-2 border-white -mb-px'
                : 'text-gray-500'
            }`}
          >
            Fixtures
          </button>
        </div>
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'fixtures' ? (
        <div className="flex-1 flex items-center justify-center px-4">
          <p className="text-gray-500 text-sm">Fixtures coming soon</p>
        </div>
      ) : (
        <div className="px-4 flex flex-col gap-4 pb-24">

          {/* ── Table Standings Card ── */}
          <div className="bg-[#141414] rounded-2xl p-4">
            {/* Card header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-bold text-[15px]">Table Standings</span>
              <button className="text-gray-500 text-xs">See All</button>
            </div>

            {/* Column headers */}
            <div className="flex items-center text-gray-500 text-xs mb-2 px-0">
              <span className="flex-1 pl-6">Club</span>
              <span className="w-7 text-center">W</span>
              <span className="w-7 text-center">D</span>
              <span className="w-7 text-center">L</span>
              <span className="w-10 text-right">Poin</span>
            </div>

            {/* Standing rows */}
            <div className="flex flex-col gap-1">
              {standings.map((row, i) => (
                <div key={i} className="flex items-center py-2 border-b border-[#1F1F1F] last:border-0">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <StatusDot status={row.status} />
                    {/* Club avatar placeholder */}
                    <div className="w-6 h-6 rounded-full bg-[#2A2A2A] flex items-center justify-center shrink-0">
                      <span className="text-[7px] text-gray-400 font-bold">{row.name.slice(0,2)}</span>
                    </div>
                    <span className="text-white text-xs font-medium truncate">{row.name}</span>
                  </div>
                  <span className="w-7 text-center text-white text-xs">{row.w}</span>
                  <span className="w-7 text-center text-white text-xs">{row.d}</span>
                  <span className="w-7 text-center text-white text-xs">{row.l}</span>
                  <span className="w-10 text-right text-white text-xs font-bold">{row.pts}</span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-5 mt-3 pt-2 border-t border-[#1F1F1F]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                <span className="text-gray-400 text-[11px]">Qualified</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
                <span className="text-gray-400 text-[11px]">Playoffs</span>
              </div>
            </div>
          </div>

          {/* ── Top Scorer Card ── */}
          <div className="bg-[#141414] rounded-2xl p-4">
            {/* Card header */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-bold text-[15px]">Top Scorer</span>
              <button className="text-gray-500 text-xs">See All</button>
            </div>

            {/* Column headers */}
            <div className="flex items-center text-gray-500 text-xs mb-2">
              <span className="flex-1">Player Name</span>
              <span className="text-right">Goals</span>
            </div>

            {/* Scorer rows */}
            <div className="flex flex-col gap-0">
              {topScorers.map((scorer, i) => (
                <div key={i} className="flex items-center py-2.5 border-b border-[#1F1F1F] last:border-0">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-[#2A2A2A]">
                      <img
                        src={scorer.avatar}
                        alt={scorer.name}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-white text-sm">{scorer.name}</span>
                  </div>
                  <span className="text-white text-sm font-bold">{scorer.goals}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Top Assister Card ── */}
          <button
            onClick={() => console.log('navigate to assisters')}
            className="bg-[#141414] rounded-2xl p-4 w-full flex items-center justify-between"
          >
            <span className="text-white font-bold text-[15px]">Top Assiter</span>
            <span className="text-white text-base">&rsaquo;</span>
          </button>

        </div>
      )}

      {/* ── Bottom Navigation (fixed) ── */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] bg-[#111111] border-t border-[#1F1F1F] px-2 py-2 flex items-center justify-around z-50">
        <button className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-white transition-colors">
          <Home size={22} />
          <span className="text-[10px]">Home</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-white transition-colors">
          <Users size={22} />
          <span className="text-[10px]">Fantasy</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 text-[#F97316]">
          <Trophy size={22} />
          <span className="text-[10px]">League</span>
        </button>
        <button className="flex flex-col items-center gap-0.5 text-gray-500 hover:text-white transition-colors">
          <Newspaper size={22} />
          <span className="text-[10px]">News</span>
        </button>
      </nav>
    </div>
  );
}
