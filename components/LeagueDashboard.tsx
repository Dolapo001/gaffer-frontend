'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LeagueHeader } from './league/LeagueHeader';
import { LiveMatchSection } from './league/LiveMatchSection';
import { LeagueTabs } from './league/LeagueTabs';
import { TableStandings } from './league/TableStandings';
import { TopPlayersList } from './league/TopPlayersList';
import { TopAssiterButton } from './league/TopAssiterButton';
import { FixturesSection } from './league/FixturesSection';
import { GoalsScoredDetails } from './league/GoalsScoredDetails';
import { LiveMatchDetails } from './league/LiveMatchDetails';

export default function LeagueDashboard() {
  const [activeTab, setActiveTab] = useState<'table' | 'fixtures'>('table');
  const [currentView, setCurrentView] = useState<'dashboard' | 'goals-scored' | 'live-match'>('dashboard');

  const renderContent = () => {
    if (currentView === 'goals-scored') {
      return <GoalsScoredDetails onBack={() => setCurrentView('dashboard')} />;
    }

    if (currentView === 'live-match') {
      return <LiveMatchDetails onBack={() => setCurrentView('dashboard')} />;
    }

    return (
      <div 
        className="flex flex-col items-center relative z-10 pt-10"
        style={{ width: '100%' }}
      >
        {/* 1. Header Area */}
        <LeagueHeader />

        {/* 2. Live Match Section - Only shown on Table tab as per screenshot flow */}
        {activeTab === 'table' && (
          <div className="w-full">
            <LiveMatchSection onCardClick={() => setCurrentView('live-match')} />
          </div>
        )}

        {/* 3. Navigation & Content Area (Applying the requested vertical rhythm) */}
        <div 
          className="flex flex-col items-center w-full"
          style={{ 
            marginTop: '13px', 
            gap: '13px',
            opacity: 1
          }}
        >
          {/* Tabs */}
          <LeagueTabs activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Tab Content */}
          <div className="flex flex-col items-center w-full" style={{ gap: '13px' }}>
            {activeTab === 'table' ? (
              <>
                <TableStandings />
                <TopPlayersList title="Top Scorers" statKey="goals" statLabel="Goals" onSeeAll={() => setCurrentView('goals-scored')} />
                <TopAssiterButton />
              </>
            ) : (
              <FixturesSection />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mx-auto relative flex flex-col min-h-screen bg-[#181928] overflow-x-hidden"
      style={{ 
        width: '100%',
        maxWidth: '375px',
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      {/* Background Gradient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-indigo-900/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[50%] h-[40%] bg-pink-900/10 blur-[120px] rounded-full pointer-events-none" />

      {renderContent()}
    </div>
  );
}
