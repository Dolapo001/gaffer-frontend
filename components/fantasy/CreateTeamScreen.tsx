'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Search, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useFantasyStore } from '@/store/fantasyStore';
import { PitchLayout } from './PitchLayout';
import { getJerseyUrl, type FantasySquadPlayer, type Position, GAMEWEEK_INFO } from '@/lib/fantasyMockData';
import { CreateTeamPlayerDrawer } from './CreateTeamPlayerDrawer';
import { SaveTeamConfirmationModal } from './SaveTeamConfirmationModal';

interface CreateTeamScreenProps {
  onComplete: () => void;
}

export const CreateTeamScreen: React.FC<CreateTeamScreenProps> = ({ onComplete }) => {
  const router = useRouter();
  const { resetTeam, players, budget, saveTeam } = useFantasyStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<{ position: Position; index: number } | null>(null);
  
  // Players in the draft
  const [draftPlayers, setDraftPlayers] = useState<FantasySquadPlayer[]>([]);
  
  // Drawer & Modal State
  const [selectedPlayerForDrawer, setSelectedPlayerForDrawer] = useState<FantasySquadPlayer | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Initialize: Reset team if it's the first time
  useEffect(() => {
    // For the demo, we start empty
    // resetTeam();
  }, []);

  const handleSelectSlot = (id: string) => {
    if (id.startsWith('empty-')) {
      const parts = id.split('-');
      const pos = parts[1] as Position;
      const idx = parseInt(parts[2]);
      setActiveSlot({ position: pos, index: idx });
      setIsSearchOpen(true);
    } else {
      // It's a player ID
      const player = draftPlayers.find(p => p.id === id);
      if (player) {
        setSelectedPlayerForDrawer(player);
      }
    }
  };

  const handleAddPlayer = (player: FantasySquadPlayer) => {
    // Add player to draft
    // In search overlay, we don't know the exact slot, but PitchLayout handles rendering based on row.
    // So we just add to the array.
    setDraftPlayers([...draftPlayers, { ...player, isOnPitch: true }]);
    setIsSearchOpen(false);
    setActiveSlot(null);
  };

  const handleRemovePlayer = (id: string) => {
    setDraftPlayers(draftPlayers.filter(p => p.id !== id));
    setSelectedPlayerForDrawer(null);
  };

  const handleSaveDraft = () => {
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSave = () => {
    setIsConfirmModalOpen(false);
    onComplete();
  };

  return (
    <div className="fixed inset-0 w-full max-w-md mx-auto bg-[#222232] flex flex-col font-sans overflow-hidden z-20">
      {/* Background Image Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-40 bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: 'url("/images/fantasy_bg.png")' }} 
      />
      
      <header className="px-6 pt-12 pb-4 relative z-10">
        <div className="flex items-center justify-center mb-6">
          <h1 className="text-white text-[24px] font-bold tracking-tight">Create Team</h1>
        </div>
        
        <p className="text-white/60 text-[12px] text-center mb-8 px-4">
          Pick Players one by one, you only get to select 3 players per club
        </p>
        
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Players :</span>
            <span className="text-white text-[14px] font-bold">{draftPlayers.length}/15</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Bank :</span>
            <span className="text-[#00ffff] text-[14px] font-mono font-bold">₦{budget.toFixed(1)}M</span>
          </div>
        </div>
      </header>
      
      {/* Deadline Bar */}
      <div className="w-full bg-[#1b1c28] py-2 relative z-10 flex justify-center items-center">
        <span className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em]">
          Deadline: {GAMEWEEK_INFO.deadlineLabel}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto relative z-10 touch-pan-y scrollbar-hide pb-32">
        <div className="px-2 mt-4">
          <PitchLayout 
            pitchPlayers={draftPlayers}
            selectedId={selectedPlayerForDrawer?.id || null}
            budget={budget}
            onSelectPlayer={handleSelectSlot}
            selectionMode={true}
          />
        </div>
        
        <div className="flex justify-center mt-12 pb-10">
          <button
            onClick={handleSaveDraft}
            className={`text-[#ff6b00] font-bold text-[20px] underline decoration-2 underline-offset-8 transition-opacity ${draftPlayers.length > 0 ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}
          >
            Save Team
          </button>
        </div>
      </div>

      {/* Player Selection Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <PlayerSearchOverlay 
            position={activeSlot?.position || 'GK'}
            onClose={() => setIsSearchOpen(false)}
            onSelect={handleAddPlayer}
          />
        )}
      </AnimatePresence>

      {/* Player Details Drawer */}
      <CreateTeamPlayerDrawer 
        player={selectedPlayerForDrawer}
        onClose={() => setSelectedPlayerForDrawer(null)}
        onRemove={handleRemovePlayer}
      />

      {/* Confirmation Modal */}
      <SaveTeamConfirmationModal 
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmSave}
      />
    </div>
  );
};

// ─── PlayerSearchOverlay Component ──────────────────────────────────────────

interface PlayerOverlayProps {
  position: Position;
  onClose: () => void;
  onSelect: (p: FantasySquadPlayer) => void;
}

const PlayerSearchOverlay: React.FC<PlayerOverlayProps> = ({ position, onClose, onSelect }) => {
    const [searchQuery, setSearchQuery] = useState('');
    
    // Mock data for search
    const mockPlayers: FantasySquadPlayer[] = [
        {
            id: 'p1',
            name: 'Akinbiyi Omoba',
            shortName: 'Omoba',
            teamName: 'Barcelona',
            teamCode: 'BAR',
            teamColor: '#004170',
            position: 'MID' as Position,
            points: 257,
            price: 10.5,
            pitchRow: 1, // MID
            isOnPitch: true,
            isCaptain: false,
            isViceCaptain: false,
            goals: 12,
            assists: 15,
            form: 8.5,
            gwHistory: [],
            nextFixtures: [{ homeTeam: 'BAR', awayTeam: 'RMA', homeCode: 'BAR', awayCode: 'RMA', kickoff: 'Sat', gameweek: 5 }],
        },
        {
            id: 'p2',
            name: 'Akinbiyi Omoba',
            shortName: 'Omoba',
            teamName: 'Barcelona',
            teamCode: 'BAR',
            teamColor: '#004170',
            position: 'MID' as Position,
            points: 257,
            price: 10.5,
            pitchRow: 1,
            isOnPitch: true,
            isCaptain: false,
            isViceCaptain: false,
            goals: 12,
            assists: 15,
            form: 8.5,
            gwHistory: [],
            nextFixtures: [],
        },
        {
            id: 'p5',
            name: 'Marc Guiu',
            shortName: 'GURU',
            teamName: 'West Ham',
            teamCode: 'WHU',
            teamColor: '#7A263A',
            position: 'FWD' as Position,
            points: 45,
            price: 5.5,
            pitchRow: 0, // FWD
            isOnPitch: true,
            isCaptain: false,
            isViceCaptain: false,
            goals: 2,
            assists: 1,
            form: 5.5,
            gwHistory: [],
            nextFixtures: [{ homeTeam: 'WHU', awayTeam: 'ARS', homeCode: 'WHU', awayCode: 'ARS', kickoff: 'Sun', gameweek: 5 }]
        },
        {
            id: 'p6',
            name: 'Virgil Van Dijk',
            shortName: 'Van Dijk',
            teamName: 'Liverpool',
            teamCode: 'LIV',
            teamColor: '#C8102E',
            position: 'DEF' as Position,
            points: 120,
            price: 6.5,
            pitchRow: 2, // DEF
            isOnPitch: true,
            isCaptain: false,
            isViceCaptain: false,
            goals: 2,
            assists: 1,
            form: 7.2,
            gwHistory: [],
            nextFixtures: []
        },
        {
            id: 'p8',
            name: 'Pascal',
            shortName: 'Pascal',
            teamName: 'West Ham',
            teamCode: 'WHU',
            teamColor: '#7A263A',
            position: 'DEF' as Position,
            points: 62,
            price: 4.5,
            pitchRow: 2,
            isOnPitch: true,
            isCaptain: false,
            isViceCaptain: false,
            goals: 0,
            assists: 1,
            form: 4.5,
            gwHistory: [],
            nextFixtures: []
        },
        {
            id: 'p9',
            name: 'Ikpi',
            shortName: 'Ikpi',
            teamName: 'Sunderland',
            teamCode: 'SUN',
            teamColor: '#FF0000',
            position: 'DEF' as Position,
            points: 44,
            price: 4.0,
            pitchRow: 2,
            isOnPitch: true,
            isCaptain: false,
            isViceCaptain: false,
            goals: 0,
            assists: 0,
            form: 3.5,
            gwHistory: [],
            nextFixtures: []
        },
        {
            id: 'p10',
            name: 'Ebenezer',
            shortName: 'Ebenezer',
            teamName: 'Scorpion',
            teamCode: 'SCO',
            teamColor: '#000000',
            position: 'DEF' as Position,
            points: 58,
            price: 4.5,
            pitchRow: 2,
            isOnPitch: true,
            isCaptain: false,
            isViceCaptain: false,
            goals: 1,
            assists: 0,
            form: 5.2,
            gwHistory: [],
            nextFixtures: []
        }
    ];

    const filteredPlayers = mockPlayers.filter(p => {
        const matchesPosition = !position || p.position === position;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesPosition && matchesSearch;
    });

    return (
        <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-[#181928] flex flex-col"
        >
            <div className="absolute inset-0 z-0 opacity-20 bg-cover bg-center pointer-events-none" style={{ backgroundImage: 'url("/images/fantasy_bg.png")' }} />
            
            <Header onClose={onClose} />
            
            <div className="flex-1 px-6 mt-4 relative z-10 flex flex-col overflow-hidden">
                {/* Search Bar */}
                <div className="relative flex items-center mb-6">
                    <Search className="absolute left-4 text-white/40" size={20} />
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search Players"
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white placeholder:text-white/20 focus:outline-none focus:border-[#ff6b00]/50 transition-colors"
                    />
                </div>
                
                {/* Filters */}
                <div className="flex gap-3 mb-8">
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 flex items-center justify-between">
                        <span className="text-white/60 text-[12px]">All Teams</span>
                        <ChevronLeft className="text-white/40 -rotate-90" size={16} />
                    </div>
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 flex items-center justify-between">
                        <span className="text-white/60 text-[12px]">Max Price</span>
                        <ChevronLeft className="text-white/40 -rotate-90" size={16} />
                    </div>
                    <button className="w-10 h-10 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
                        <Trash2 className="text-white/40" size={18} />
                    </button>
                </div>
                
                {/* Table Header */}
                <div className="flex text-white/40 text-[10px] uppercase font-bold tracking-widest px-2 mb-4">
                    <div className="flex-1">Player in</div>
                    <div className="w-16 text-right">Price</div>
                    <div className="w-1 bg-white/10 mx-2" />
                    <div className="w-16 text-right">Points</div>
                </div>
                
                {/* Player List */}
                <div className="flex-1 overflow-y-auto space-y-1 pb-24 scrollbar-hide">
                   {filteredPlayers.length > 0 ? (
                       filteredPlayers.map(p => (
                           <PlayerRow key={p.id} player={p} onClick={() => onSelect(p)} />
                       ))
                   ) : (
                       <div className="text-center py-20 text-white/20 font-bold uppercase tracking-widest">
                           No Players Found
                       </div>
                   )}
                </div>
            </div>
            
            {/* Footer */}
            <div className="mt-auto px-6 py-4 bg-[#1b1c28]/95 backdrop-blur-md border-t border-white/10 flex justify-between items-center z-20">
                <div className="flex items-center gap-2">
                    <span className="text-white/40 text-[11px] font-bold">Free Transfer :</span>
                    <span className="text-white text-[11px] font-bold tracking-widest">2</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-white/40 text-[11px] font-bold">Bank :</span>
                    <span className="text-[#00ffff] text-[11px] font-bold font-mono">₦1.9M</span>
                </div>
            </div>
        </motion.div>
    );
}

const Header = ({ onClose }: { onClose: () => void }) => (
    <div className="px-6 pt-10 pb-4 flex items-center relative z-10">
        <button onClick={onClose} className="p-2 -ml-2 text-white">
            <X size={28} />
        </button>
        <div className="flex-1" />
    </div>
);

const PlayerRow = ({ player, onClick }: { player: FantasySquadPlayer, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className="w-full flex items-center py-3 px-2 hover:bg-white/5 transition-colors border-b border-white/5 group"
    >
        <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 relative mr-3 border border-white/20">
            <img 
              src={getJerseyUrl(player.teamCode, player.position)} 
              alt={player.name} 
              className="w-full h-full object-contain p-1"
            />
            {/* Small Club Logo Overlay */}
            <div className="absolute bottom-0 left-0 w-5 h-5 bg-[#004170] rounded-sm flex items-center justify-center border border-white/20 p-0.5">
                {/* Placeholder for club logo */}
                <div className="w-full h-full bg-red-600 rounded-sm" />
            </div>
        </div>
        
        <div className="flex flex-col items-start flex-1">
            <span className="text-white text-[14px] font-bold truncate group-hover:text-[#ff6b00] transition-colors">
                {player.name}
            </span>
            <span className="text-[#ff4d00] text-[10px] font-bold uppercase">{player.position}</span>
        </div>
        
        <div className="w-16 text-right text-white text-[13px] font-medium">{player.price}M</div>
        <div className="w-1 bg-white/10 h-4 mx-2" />
        <div className="w-16 text-right text-white text-[13px] font-medium">{player.points}</div>
    </button>
);
