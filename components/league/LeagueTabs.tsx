'use client';

interface LeagueTabsProps {
  activeTab: 'table' | 'fixtures';
  onTabChange: (tab: 'table' | 'fixtures') => void;
}

export function LeagueTabs({ activeTab, onTabChange }: LeagueTabsProps) {
  return (
    <div className="w-full flex justify-center mb-6 px-4">
      <div 
        className="p-[3.15px] flex items-center bg-[#FFFFFF0D] border-t-[0.83px] border-white/5"
        style={{ 
          width: '297px', 
          height: '38px', 
          borderRadius: '9.94px',
          borderWidth: '0.83px',
          borderColor: '#FFFFFF0D'
        }}
      >
        <button
          onClick={() => onTabChange('table')}
          className={`flex-1 h-full rounded-[8px] text-[13px] font-bold transition-all duration-200 ${
            activeTab === 'table'
              ? 'bg-[#2a2b45] text-white shadow-lg'
              : 'text-[#94a3b8] hover:text-white'
          }`}
        >
          Table
        </button>
        <button
          onClick={() => onTabChange('fixtures')}
          className={`flex-1 h-full rounded-[8px] text-[13px] font-bold transition-all duration-200 ${
            activeTab === 'fixtures'
              ? 'bg-[#2a2b45] text-white shadow-lg'
              : 'text-[#94a3b8] hover:text-white'
          }`}
        >
          Fixtures
        </button>
      </div>
    </div>
  );
}

