'use client';

import { useState } from 'react';
import { LeagueHeader } from './league/LeagueHeader';
import { LiveMatchSection } from './league/LiveMatchSection';
import { LeagueTabs } from './league/LeagueTabs';
import { TableStandings } from './league/TableStandings';
import { TopScorers } from './league/TopScorers';
import { TopAssiterButton } from './league/TopAssiterButton';

export default function LeagueDashboard() {
  const [activeTab, setActiveTab] = useState<'table' | 'fixtures'>('table');

  return (
    <div className="mx-auto relative flex flex-col font-sans mb-20"
      style={{ 
        width: '100%',
        maxWidth: '329px', 
        minHeight: '1304px', 
        borderRadius: '28.03px', 
        backgroundColor: '#181928',
        opacity: 1,
        transform: 'rotate(0deg)',
        overflow: 'visible'
      }}
    >
      {/* Background Gradient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-indigo-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[40%] bg-pink-900/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Main Content Container */}
      <div 
        className="flex flex-col pt-4 pb-12"
        style={{ width: '100%', gap: '13px' }}
      >
        {/* 1. Header Area */}
        <LeagueHeader />

        {/* 2. Live Match Section */}
        <LiveMatchSection />

        {/* 3. Navigation Tabs */}
        <LeagueTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 4. Tab Content */}
        {activeTab === 'table' ? (
          <div className="flex flex-col" style={{ gap: '13px' }}>
            <TableStandings />
            <TopScorers />
            <TopAssiterButton />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-[#1a1b2e]/60 rounded-[28px] border border-white/5 mx-4" style={{ height: '378.47px' }}>
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <span className="text-white/20 text-4xl">📅</span>
            </div>
            <h3 className="text-white font-bold text-lg mb-1 uppercase tracking-tight">No Fixtures</h3>
            <p className="text-gray-500 text-sm">Upcoming matches are being scheduled.</p>
          </div>
        )}
      </div>
    </div>
  );
}

