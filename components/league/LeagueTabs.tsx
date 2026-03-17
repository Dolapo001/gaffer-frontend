'use client';

interface LeagueTabsProps {
  activeTab: 'table' | 'fixtures';
  onTabChange: (tab: 'table' | 'fixtures') => void;
}

export function LeagueTabs({ activeTab, onTabChange }: LeagueTabsProps) {
  return (
    <div className="w-full flex justify-center mb-6 px-4">
      <div 
        className="flex items-center"
        style={{ 
          width: '302.25px', 
          height: '38px', 
          backgroundColor: '#FFFFFF0D',
          borderRadius: '9.94px',
          borderTop: '0.83px solid #FFFFFF0D',
          padding: '3.15px',
          opacity: 1
        }}
      >
        <button
          onClick={() => onTabChange('table')}
          className="flex items-center justify-center transition-all duration-200"
          style={{
            width: '144.52px',
            height: '30.26px',
            borderRadius: '6.63px',
            backgroundColor: activeTab === 'table' ? '#FFFFFF1A' : 'transparent',
            boxShadow: activeTab === 'table' ? '0px 0.83px 1.66px 0px #0000000D' : 'none',
            paddingTop: '6.63px',
            paddingBottom: '6.63px',
            // Step 241/251: Typography
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            fontSize: '11.6px',
            lineHeight: '16.57px',
            textAlign: 'center',
            color: activeTab === 'table' ? '#FFFFFF' : '#94A3B8'
          }}
        >
          <span style={{ width: '32px', height: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Table
          </span>
        </button>
        <button
          onClick={() => onTabChange('fixtures')}
          className="flex items-center justify-center transition-all duration-200"
          style={{
            width: '144.52px',
            height: '30.26px',
            borderRadius: '6.63px',
            backgroundColor: activeTab === 'fixtures' ? '#FFFFFF1A' : 'transparent',
            boxShadow: activeTab === 'fixtures' ? '0px 0.83px 1.66px 0px #0000000D' : 'none',
            paddingTop: '6.63px',
            paddingBottom: '6.63px',
            // Step 241/251: Typography
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            fontSize: '11.6px',
            lineHeight: '16.57px',
            textAlign: 'center',
            color: activeTab === 'fixtures' ? '#FFFFFF' : '#94A3B8'
          }}
        >
          <span style={{ width: '47px', height: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Fixtures
          </span>
        </button>
      </div>
    </div>
  );
}

