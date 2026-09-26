'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Search, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useFantasyStore } from '@/store/fantasyStore';
import { PitchLayout } from './PitchLayout';
import { getJerseyUrl, type FantasySquadPlayer, type Position } from '@/lib/fantasyMockData';
import CreateTeamPlayerDrawer from './CreateTeamPlayerDrawer';
import { SaveTeamConfirmationModal } from './SaveTeamConfirmationModal';
import { listFantasyPlayers, listGameweeks, SQUAD_RULES, type FantasyPlayer } from '@/lib/services/fantasy.service';
import { listFixtures } from '@/lib/services/fixture.service';
import { PositionFilterBar, type PositionFilterValue } from '@/components/PositionFilterBar';
import { formatSquadValue } from '@/lib/format';

import { mapApiPlayer } from '@/lib/converters';

interface CreateTeamScreenProps {
  onComplete: () => void;
}

export const CreateTeamScreen: React.FC<CreateTeamScreenProps> = ({ onComplete }) => {
  const router = useRouter();
  const { competitionId, resetTeam, setPlayers, squadBudget } = useFantasyStore();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<{ position: Position; index: number } | null>(null);

  // Players in the draft
  const [draftPlayers, setDraftPlayers] = useState<FantasySquadPlayer[]>([]);

  // Bank is derived from the draft rather than kept as a running total, so it
  // can't drift (e.g. a double-tap used to charge a player's price twice).
  const budget = squadBudget - draftPlayers.reduce((sum, p) => sum + (p.price ?? 0), 0);
  const positionCounts = draftPlayers.reduce<Record<string, number>>((acc, p) => {
    acc[p.position] = (acc[p.position] ?? 0) + 1;
    return acc;
  }, {});
  const isSquadComplete = (Object.keys(SQUAD_RULES.positions) as Position[])
    .every((pos) => (positionCounts[pos] ?? 0) === SQUAD_RULES.positions[pos]);

  // Drawer & Modal State
  const [selectedPlayerForDrawer, setSelectedPlayerForDrawer] = useState<FantasySquadPlayer | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Initialize: Reset team if it's the first time
  useEffect(() => {
     resetTeam();
     setDraftPlayers([]);
  }, []);

  // Real gameweek deadline — derived from the tournament's fixture schedule,
  // never hardcoded. Falls back to "TBA" if no gameweeks exist yet.
  const { data: gameweeks } = useQuery({
    queryKey: ['fantasy-gameweeks', competitionId],
    queryFn: () => listGameweeks(competitionId!),
    enabled: !!competitionId,
  });
  const currentGameweek = gameweeks?.find((gw) => gw.lockStatus === 'open') ?? gameweeks?.[0];

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
    // Functional update + guards: a repeat tap on a closing overlay is a no-op
    setDraftPlayers((prev) => {
      if (prev.some((p) => p.id === player.id)) return prev;
      const posCount = prev.filter((p) => p.position === player.position).length;
      if (posCount >= (SQUAD_RULES.positions[player.position as Position] ?? 0)) return prev;
      return [...prev, { ...player, isOnPitch: true }];
    });
    setIsSearchOpen(false);
    setActiveSlot(null);
  };

  const handleRemovePlayer = (player: FantasySquadPlayer) => {
    setDraftPlayers(draftPlayers.filter(p => p.id !== player.id));
    setSelectedPlayerForDrawer(null);
  };

  const handleSaveDraft = () => {
    if (!isSquadComplete || budget < 0) return;
    setIsConfirmModalOpen(true);
  };

  const handleConfirmSave = () => {
    setPlayers(apply442(draftPlayers));
    setIsConfirmModalOpen(false);
    onComplete();
  };

  return (
    <div className="fixed inset-0 w-full max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto bg-[#222232] flex flex-col font-sans overflow-hidden z-20">
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
            <span className="text-[#00ffff] text-[14px] font-mono font-bold font-display">{formatSquadValue(budget)}</span>
          </div>
        </div>
      </header>

      {/* Deadline Bar */}
      <div className="w-full bg-[#1b1c28] py-2 relative z-10 flex justify-center items-center">
        <span className="text-white/40 text-[9px] font-bold uppercase tracking-[0.2em]">
          {currentGameweek
            ? `GW${currentGameweek.gameweekNumber} Deadline: ${format(new Date(currentGameweek.deadline), 'EEE d MMM, HH:mm')}`
            : 'Deadline: TBA'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto relative z-10 touch-pan-y pb-32 min-h-0">
        <div className="px-2 mt-4">
          <PitchLayout
            pitchPlayers={draftPlayers}
            selectedId={selectedPlayerForDrawer?.id || null}
            budget={budget}
            onSelectPlayer={handleSelectSlot}
            selectionMode={true}
          />
        </div>

        <div className="flex flex-col items-center gap-4 mt-12 pb-10">
          {!isSquadComplete && (
            <p className="text-white/60 text-[12px] text-center px-6">
              Still needed:{' '}
              {(Object.keys(SQUAD_RULES.positions) as Position[])
                .filter((pos) => (positionCounts[pos] ?? 0) < SQUAD_RULES.positions[pos])
                .map((pos) => `${SQUAD_RULES.positions[pos] - (positionCounts[pos] ?? 0)} ${pos}`)
                .join(', ')}
            </p>
          )}
          <button
            onClick={handleSaveDraft}
            disabled={!isSquadComplete || budget < 0}
            className="text-[#ff6b00] font-black text-[28px] uppercase tracking-wider underline decoration-4 underline-offset-[12px] transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          >
            Save Team
          </button>
        </div>
      </div>

      {/* Player Selection Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <PlayerSearchOverlay
            // Fresh instance per slot so the position filter always matches the tapped slot
            key={`${activeSlot?.position}-${activeSlot?.index}`}
            position={activeSlot?.position || 'GK'}
            competitionId={competitionId || ''}
            draftPlayers={draftPlayers}
            budget={budget}
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

// ─── Auto 4-4-2 Formation ────────────────────────────────────────────────────
// Assigns 1 GK, 4 DEF, 4 MID, 2 FWD to pitch; rest go to bench.
// Bench order: remaining DEF/MID/FWD first, then the reserve GK last.
function apply442(players: FantasySquadPlayer[]): FantasySquadPlayer[] {
  const STARTERS: Record<string, number> = { GK: 1, DEF: 4, MID: 4, FWD: 2 };
  const counts: Record<string, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };

  return players.map((p) => {
    const pos = p.position as string;
    const limit = STARTERS[pos] ?? 0;
    const isStarter = counts[pos] < limit;
    if (isStarter) counts[pos]++;
    return { ...p, isOnPitch: isStarter };
  });
}

// ─── PlayerSearchOverlay Component ──────────────────────────────────────────

interface PlayerOverlayProps {
  position: Position;
  draftPlayers: FantasySquadPlayer[];
  budget: number;
  onClose: () => void;
  onSelect: (p: FantasySquadPlayer) => void;
}

const PlayerSearchOverlay: React.FC<PlayerOverlayProps & { competitionId: string }> = ({ position, competitionId, draftPlayers, budget, onClose, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [maxPrice, setMaxPrice] = useState<number>(20);
  // Defaults to whichever position slot was tapped, but the filter bar below
  // lets the user browse other positions from the same overlay — selecting a
  // player elsewhere doesn't depend on which slot opened it (final pitch
  // placement is derived from the player's own position at Save time).
  const [positionFilter, setPositionFilter] = useState<PositionFilterValue>(position);
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);

  const showBlockedMessage = (message: string) => {
    setBlockedMessage(message);
    setTimeout(() => setBlockedMessage(null), 2500);
  };

  const positionCounts = draftPlayers.reduce<Record<string, number>>((acc, p) => {
    acc[p.position] = (acc[p.position] ?? 0) + 1;
    return acc;
  }, {});

  // Count players per real team (use teamId._id for accuracy)
  const teamCounts: Record<string, number> = {};
  draftPlayers.forEach(p => {
    const key = (p as any).teamIdRef || p.teamName;
    teamCounts[key] = (teamCounts[key] || 0) + 1;
  });

  const { data: playerResponse, isLoading } = useQuery({
    queryKey: ['fantasy-market-players', competitionId],
    queryFn: async () => {
      const first = await listFantasyPlayers(competitionId, { pageSize: 100, page: 1 });
      const totalPages = Math.ceil(first.total / 100);
      if (totalPages <= 1) return first;
      const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          listFantasyPlayers(competitionId, { pageSize: 100, page: i + 2 })
        )
      );
      return { ...first, data: [...first.data, ...rest.flatMap(r => r.data)] };
    },
    enabled: !!competitionId
  });

  const { data: fixtures } = useQuery({
    queryKey: ['fantasy-fixtures', competitionId],
    queryFn: () => listFixtures(competitionId),
    enabled: !!competitionId
  });

  const POS_NORMALIZE: Record<string, string> = {
    goalkeeper: 'GK', gk: 'GK',
    defender: 'DEF', def: 'DEF', 'center-back': 'DEF', 'centre-back': 'DEF', 'full-back': 'DEF', cb: 'DEF', rb: 'DEF', lb: 'DEF',
    midfielder: 'MID', mid: 'MID', mf: 'MID', cm: 'MID', dm: 'MID', am: 'MID',
    forward: 'FWD', fwd: 'FWD', fw: 'FWD', st: 'FWD', cf: 'FWD', lw: 'FWD', rw: 'FWD',
  };
  const normalizePos = (p: string) => POS_NORMALIZE[p?.trim().toLowerCase()] || p?.trim().toUpperCase() || '';

  const positionMatchedPlayers = (playerResponse?.data || []).filter(p =>
    positionFilter === 'ALL' || normalizePos(p.position) === positionFilter
  );

  const excludeIds = draftPlayers.map(p => p.id);
  const apiPlayers = positionMatchedPlayers.filter(p => {
    if (excludeIds.includes(p._id)) return false;
    const teamName = p.teamId?.name || '';
    if (selectedTeam !== 'all' && teamName !== selectedTeam) return false;
    if (p.price > maxPrice) return false;
    return true;
  });

  const mappedPlayers = apiPlayers.map(p => {
    const teamIdKey = (p.teamId as any)?._id || p.teamId?.name || '';
    const normalized = { ...p, position: normalizePos(p.position) as FantasyPlayer['position'] };
    const pos = normalized.position as Position;
    let blockedReason: string | null = null;
    if ((positionCounts[pos] ?? 0) >= (SQUAD_RULES.positions[pos] ?? 0)) {
      blockedReason = `All ${SQUAD_RULES.positions[pos]} ${pos} slots filled`;
    } else if ((teamCounts[teamIdKey] ?? 0) >= 3) {
      blockedReason = '3 max reached';
    } else if (p.price > budget) {
      blockedReason = 'Not enough in bank';
    }
    return {
      ...mapApiPlayer(normalized, [], [], null, null, fixtures || []),
      teamIdRef: teamIdKey,
      blockedReason,
    };
  });

  // Only show teams that have players for the current position
  const allTeams = Array.from(new Set(positionMatchedPlayers.map(p => p.teamId?.name))).filter(Boolean);

  const filteredPlayers = mappedPlayers.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleReset = () => {
    setSearchQuery('');
    setSelectedTeam('all');
    setMaxPrice(20);
    setPositionFilter(position);
  };



  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-[#1a1b2e] flex flex-col"
    >
            {/* Design Background Overlay */}
            <div className="absolute inset-0 z-0 opacity-60">
                <div className="absolute inset-0 bg-gradient-to-b from-[#1a1b2e]/60 via-transparent to-[#1a1b2e]" />
                <div 
                    className="absolute inset-0 bg-cover bg-center opacity-70 pointer-events-none"
                    style={{ backgroundImage: 'url("/images/fantasy_bg.png")' }} 
                />
            </div>

      <Header onClose={onClose} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      <div className="flex-1 px-6 mt-4 relative z-10 flex flex-col min-h-0 overflow-hidden">
        {/* Position Filter Bar */}
        <PositionFilterBar value={positionFilter} onChange={setPositionFilter} className="mb-3" />

        {/* Filters Row */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1 relative">
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full bg-[#2a2b3d]/80 border border-white/10 rounded-lg px-4 py-2 text-white text-[12px] appearance-none focus:outline-none focus:border-gaffer-orange/50"
            >
              <option value="all">All Teams</option>
              {allTeams.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 -rotate-90 pointer-events-none" size={14} />
          </div>

          <div className="flex-1 relative">
            <select
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full bg-[#2a2b3d]/80 border border-white/10 rounded-lg px-4 py-2 text-white text-[12px] appearance-none focus:outline-none focus:border-gaffer-orange/50"
            >
              <option value={20}>Max Price</option>
              {[15, 12, 10, 8, 6, 4].map(price => (
                <option key={price} value={price}>{formatSquadValue(price)}</option>
              ))}
            </select>
            <ChevronLeft className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 -rotate-90 pointer-events-none" size={14} />
          </div>

          <button
            onClick={handleReset}
            className="w-10 h-10 bg-[#2a2b3d]/80 border border-white/10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Trash2 className="text-white/40" size={18} />
          </button>
        </div>

        {/* Table Header */}
        <div className="flex items-center text-white/40 text-[10px] uppercase font-bold tracking-widest px-2 mb-4">
          <div className="flex-1">Player in</div>
          <div className="w-16 text-right">Price</div>
          <div className="w-1 bg-white/10 h-3 mx-3" />
          <div className="w-16 text-right">Points</div>
        </div>

        {/* Player List */}
        <div className="flex-1 overflow-y-auto space-y-1 pb-24">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 rounded-full border-2 border-[#ff6b00] border-t-transparent animate-spin" />
            </div>
          ) : filteredPlayers.length > 0 ? (
            filteredPlayers.map(p => (
              <PlayerRow
                key={p.id}
                player={p}
                blockedReason={p.blockedReason}
                onClick={() => {
                  if (p.blockedReason === '3 max reached') {
                    showBlockedMessage("You've already picked 3 players from this team");
                  } else if (p.blockedReason) {
                    showBlockedMessage(p.blockedReason);
                  } else {
                    onSelect(p);
                  }
                }}
              />
            ))
          ) : (
            <div className="text-center py-20 text-white/20 font-bold uppercase tracking-widest">
              No Players Found
            </div>
          )}
        </div>
      </div>

            {/* Team limit toast */}
            <AnimatePresence>
              {blockedMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-24 left-1/2 -translate-x-1/2 z-[150] bg-[#ff4d00] text-white text-[12px] font-bold px-5 py-2.5 rounded-full shadow-lg whitespace-nowrap"
                >
                  {blockedMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Solid Footer Info Bar - Floating above the Navbar with higher z-index */}
            <div className="absolute bottom-[120px] left-0 right-0 bg-[#3d3f56]/95 backdrop-blur-md px-8 py-3 flex justify-between items-center z-[130] border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                <div className="text-white text-[12px] font-medium tracking-tight">
                    Squad : <span className="text-white opacity-60 ml-2">{draftPlayers.length}/15</span>
                </div>
                <div className="text-white text-[12px] font-medium tracking-tight">
                    Bank : <span className="text-white opacity-60 ml-3">{formatSquadValue(budget)}</span>
                </div>
            </div>
    </motion.div>
  );
};

const Header = ({ onClose, searchQuery, onSearchChange }: { onClose: () => void, searchQuery: string, onSearchChange: (v: string) => void }) => (
  <div className="px-6 pt-10 pb-4 flex items-center gap-4 relative z-10">
    <button onClick={onClose} className="p-2 -ml-2 text-white/60 hover:text-white transition-colors">
      <X size={28} />
    </button>

    <div className="flex-1 relative flex items-center">
      <Search className="absolute left-4 text-white/20" size={18} />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search Players"
        className="w-full bg-[#2a2b3d]/60 border border-white/10 rounded-full py-2.5 pl-11 pr-4 text-white text-[14px] placeholder:text-white/20 focus:outline-none focus:border-gaffer-orange/50 transition-all"
      />
    </div>
  </div>
);

const PlayerRow = ({ player, blockedReason, onClick }: { player: FantasySquadPlayer, blockedReason?: string | null, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center py-3 px-2 transition-colors border-b border-white/5 group ${blockedReason ? 'opacity-40' : 'hover:bg-white/5'}`}
  >
    <div className="w-12 h-12 rounded-full overflow-hidden bg-[#2a2b3d] relative mr-4 border border-white/10 shadow-lg">
      <img
        src={player.avatarUrl || `https://i.pravatar.cc/100?u=${player.id}`}
        alt={player.name}
        className="w-full h-full object-cover object-top"
      />
      <div className="absolute bottom-0 left-0 w-6 h-6 bg-white rounded-full flex items-center justify-center border-2 border-[#2a2b3d] p-0.5 shadow-md">
        <div className="w-full h-full bg-[#004170] rounded-full" />
      </div>
    </div>

    <div className="flex flex-col items-start flex-1 min-w-0">
      <span className={`text-[15px] font-bold truncate transition-colors leading-tight ${blockedReason ? 'text-white/60' : 'text-white group-hover:text-[#ff6b00]'}`}>
        {player.name}
      </span>
      <span className="text-[#ff4d00] text-[10px] font-black uppercase tracking-wider mt-0.5">
        {player.position}{blockedReason ? ` · ${blockedReason}` : ''}
      </span>
    </div>

    <div className="flex items-center gap-1.5 min-w-[120px] justify-end">
      <div className="text-right text-white text-[14px] font-black tracking-tighter w-14">{formatSquadValue(player.price ?? 0)}</div>
      <div className="w-[1px] bg-white/10 h-3 mx-1" />
      <div className="text-right text-white text-[14px] font-black w-14">{player.points ?? 0}</div>
    </div>
  </button>
);
