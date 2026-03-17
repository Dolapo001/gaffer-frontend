'use client';

import { useState } from 'react';
import { ChevronLeft, Info } from 'lucide-react';

interface PlayerPosition {
  id: string;
  initials: string;
  name: string;
  color: string;
}

interface CommentaryData {
  id: string;
  type: 'text' | 'yellow-card' | 'substitution' | 'goal' | 'corner';
  text: string;
  subText?: string;
  color: string;
}

interface LiveMatchDetailsProps {
  onBack: () => void;
}

export function LiveMatchDetails({ onBack }: LiveMatchDetailsProps) {
  const [activeTab, setActiveTab] = useState<'lineup' | 'commentary'>('lineup');

  const commentaryItems: CommentaryData[] = [
    { id: '1', type: 'text', text: 'Full Time !!! Civil Engineering takes the win in a hard-fought derby.', color: '#A11D44' },
    { id: '2', type: 'text', text: 'Attempt missed. Tunde (MECH) header from the center of the box is close, but misses to the right.', color: '#59A8D4' },
    { id: '3', type: 'yellow-card', text: 'Yellow Card. Chidi (MECH) for a heavy challenge on the halfway line.', color: '#59A8D4' },
    { id: '4', type: 'text', text: 'Yellow Card. Chidi (MECH) for a heavy challenge on the halfway line.', color: '#59A8D4' },
    { id: '5', type: 'substitution', text: 'Substitution, CIVIL. Victor replaces Segun because of a tactical change.', color: '#A11D44' },
    { id: '6', type: 'goal', text: 'GOOOOOOOOALLLLLLLLLLLLLLLLLLLLLLLLL!', color: '#A11D44' },
    { id: '7', type: 'goal', text: 'GOAL. Victor (CIVIL)', subText: 'ASSIT. Segun (CIVIL)', color: '#A11D44' },
    { id: '8', type: 'corner', text: 'Corner, CIVIL. Conceded by Ibrahim.', color: '#A11D44' },
  ];

  return (
    <div 
      className="mx-auto relative flex flex-col pb-10"
      style={{ 
        width: '329px', 
        height: '1099px', 
        borderRadius: '28.03px', 
        backgroundColor: '#181928',
        fontFamily: "'Poppins', sans-serif",
        overflowX: 'hidden',
        paddingTop: '36.94px'
      }}
    >
      {/* Header (Step 626 Specs) */}
      <div 
        className="flex items-center justify-between px-6 relative mb-8"
        style={{ 
          width: '328.53px', 
          height: '49.06px',
          left: '0.23px',
          backgroundColor: '#181928'
        }}
      >
        <button onClick={onBack} className="text-white">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-white text-[18px] font-bold">Final Score</h1>
        <button className="text-white">
          <Info size={20} />
        </button>
      </div>

      {/* Scoreboard Area (Step 632 Specs) */}
      <div 
        className="flex flex-col items-center relative"
        style={{ 
          width: '295px', 
          height: '153.91px',
          marginLeft: '15.23px',
          marginTop: '20px',
        }}
      >
        <div className="mb-4">
          <span className="text-[#00FF85] text-[14px] font-medium">Full Time</span>
        </div>

        <div className="flex items-center justify-between w-full px-2 mb-2">
          <div className="flex flex-col items-center">
            <img src="https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28logo%29.svg" alt="Barcelona" className="w-[60px] h-[60px] object-contain" />
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-white text-[42px] font-bold">2</span>
            <span className="text-white text-[42px] font-bold opacity-30">-</span>
            <span className="text-white text-[42px] font-bold">2</span>
          </div>

          <div className="flex flex-col items-center">
            <img src="https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg" alt="Man City" className="w-[60px] h-[60px] object-contain" />
          </div>
        </div>

        {/* Scorers (Step 645 Specs) */}
        <div 
          className="absolute flex justify-between w-full text-[10px] leading-tight"
          style={{ 
            height: '38.78px',
            top: '115.13px',
          }}
        >
          <div className="flex flex-col text-white opacity-80">
            <span>De Jong 66'</span>
            <span>Depay 79'</span>
          </div>
          <div className="flex flex-col text-white items-end opacity-80">
            <span>Omoba 59'</span>
            <span>Palmer 70'</span>
          </div>
        </div>
      </div>

      {/* Tabs (Step 638 Specs) */}
      <div 
        className="flex border-b border-white/10 relative"
        style={{ 
          width: '300.5px', 
          height: '25px',
          marginLeft: '14.23px',
          marginTop: '18px',
          marginBottom: '20px'
        }}
      >
        <button 
          onClick={() => setActiveTab('lineup')}
          className={`flex-1 flex items-center justify-center text-[12px] font-medium relative transition-colors ${activeTab === 'lineup' ? 'text-white' : 'text-white/40'}`}
        >
          Line-up
          {activeTab === 'lineup' && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#FF4D00]" />}
        </button>
        <button 
          onClick={() => setActiveTab('commentary')}
          className={`flex-1 flex items-center justify-center text-[12px] font-medium relative transition-colors ${activeTab === 'commentary' ? 'text-white' : 'text-white/40'}`}
        >
          Commentary
          {activeTab === 'commentary' && <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#FF4D00]" />}
        </button>
      </div>

      {/* Tab Content */}
      <div className="relative">
        {activeTab === 'lineup' ? (
          <>
            {/* Top Team & Formation Header (Step 651 Specs) */}
            <div 
              className="flex justify-between items-center relative mb-4"
              style={{ 
                width: '298px', 
                height: '12px',
                marginLeft: '15.23px',
                marginTop: '18px'
              }}
            >
              <div className="flex items-center gap-2 h-full">
                <img src="https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28logo%29.svg" alt="COCCS" className="w-3 h-3 object-contain" />
                <span className="text-white text-[12px] font-bold leading-none">COCCS</span>
              </div>
              <span className="text-white/60 text-[10px] leading-none">3-5-2</span>
            </div>

            {/* Field Container (Step 660 & 671 Specs) */}
            <div 
              className="relative overflow-hidden" 
              style={{ 
                width: '318px', 
                height: '609px',
                marginLeft: '5.23px',
                borderRadius: '10.65px',
                border: '2px solid #FFFFFF',
                backgroundColor: '#242838',
                boxShadow: '0px 22.18px 44.36px -10.65px rgba(0, 0, 0, 0.25)'
              }}
            >
              <div className="absolute inset-0 p-4 pointer-events-none">
                <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/20" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/20 rounded-full" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-44 h-16 border-2 border-t-0 border-white/20" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-44 h-16 border-2 border-b-0 border-white/20" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 border-2 border-t-0 border-white/20" />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-6 border-2 border-b-0 border-white/20" />
              </div>

              {/* Player Overlay */}
              <div className="absolute flex flex-col justify-around py-4" style={{ width: '310px', height: '658px', left: '4px', top: '-24.5px' }}>
                <div className="flex justify-center"><PlayerIcon initials="ARS" name="Ramsdale" color="#B8860B" /></div>
                <div className="flex justify-around px-1">
                  <PlayerIcon initials="A" name="Alagbe" color="#B8860B" /><PlayerIcon initials="I" name="Ikpi" color="#B8860B" /><PlayerIcon initials="E" name="Ebenezer" color="#0A2647" /><PlayerIcon initials="P" name="Pascal" color="#0A2647" />
                </div>
                <div className="flex justify-around px-1">
                  <PlayerIcon initials="O" name="Omoba" color="#B8860B" /><PlayerIcon initials="I" name="Issachar" color="#B8860B" /><PlayerIcon initials="M" name="Mario" color="#0A2647" /><PlayerIcon initials="W" name="Wisdom" color="#0A2647" />
                </div>
                <div className="flex flex-col gap-6">
                  <div className="flex justify-center gap-10">
                    <PlayerIcon initials="D" name="Dahood" color="#B8860B" /><PlayerIcon initials="G" name="Greenwood" color="#006400" />
                  </div>
                  <div className="flex justify-center gap-10">
                    <PlayerIcon initials="D" name="Dahood" color="#B8860B" /><PlayerIcon initials="G" name="Greenwood" color="#006400" />
                  </div>
                </div>
                <div className="flex justify-around px-1">
                  <PlayerIcon initials="O" name="Omoba" color="#B8860B" /><PlayerIcon initials="I" name="Issachar" color="#B8860B" /><PlayerIcon initials="M" name="Mario" color="#0A2647" /><PlayerIcon initials="W" name="Wisdom" color="#0A2647" />
                </div>
                <div className="flex justify-around px-1">
                  <PlayerIcon initials="A" name="Alagbe" color="#B8860B" /><PlayerIcon initials="I" name="Ikpi" color="#B8860B" /><PlayerIcon initials="E" name="Ebenezer" color="#0A2647" /><PlayerIcon initials="P" name="Pascal" color="#0A2647" />
                </div>
                <div className="flex justify-center"><PlayerIcon initials="ARS" name="Ramsdale" color="#B8860B" /></div>
              </div>
            </div>

            {/* Bottom Team Footer (Step 678 Specs) - ONLY in Line-up view */}
            <div 
              className="flex justify-between items-center relative"
              style={{ 
                width: '298px', 
                height: '12px',
                marginLeft: '15.23px',
                marginTop: '18px',
                backgroundColor: '#181928'
              }}
            >
              <div className="flex items-center gap-2 h-full">
                <img src="https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28logo%29.svg" alt="COCCS" className="w-3 h-3 object-contain" />
                <span className="text-white text-[12px] font-bold leading-none">COCCS</span>
              </div>
              <span className="text-white/60 text-[10px] leading-none">3-5-2</span>
            </div>
          </>
        ) : (
          <div 
            className="flex flex-col gap-3 px-4 pb-20 no-scrollbar overflow-y-auto"
            style={{ 
              width: '329px',
              height: '670px',
              marginTop: '10px'
            }}
          >
            {commentaryItems.map((item) => (
              <div key={item.id} className="rounded-[10.65px] p-3 flex gap-3 items-start shadow-sm" style={{ backgroundColor: item.color }}>
                {item.type === 'yellow-card' && <div className="w-5 h-7 bg-[#FFFF00] rounded-sm shrink-0 mt-1" />}
                {item.type === 'substitution' && (
                  <div className="w-6 h-6 shrink-0 mt-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" />
                    </svg>
                  </div>
                )}
                {item.type === 'goal' && (
                   <div className="flex flex-col gap-1 items-center shrink-0 mt-1">
                      <div className="w-5 h-5 rounded-full border border-white flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full" /></div>
                      {item.subText && <div className="w-4 h-4 mt-1"><svg viewBox="0 0 24 24" fill="white"><path d="M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5Z" /></svg></div>}
                   </div>
                )}
                {item.type === 'corner' && (
                   <div className="w-6 h-6 shrink-0 mt-1 text-white">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M10 4v16" /><path d="M14 4v16" /><path d="M2 10h20" /><path d="M2 14h20" /></svg>
                   </div>
                )}
                <div className="flex flex-col gap-0.5">
                  <p className="text-white text-[10px] font-medium">{item.text}</p>
                  {item.subText && <p className="text-white text-[10px] font-bold">{item.subText}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PlayerIcon({ initials, name, color }: { initials: string, name: string, color: string }) {
    return (
        <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-[14px] font-bold shadow-xl" style={{ backgroundColor: color }}>{initials}</div>
            <div className="bg-[#1a1b2e]/80 px-2 py-0.5 rounded shadow-sm">
                <span className="text-white text-[8px] font-medium whitespace-nowrap">{name}</span>
            </div>
        </div>
    );
}
