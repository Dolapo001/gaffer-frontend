'use client';

import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/match/PitchKit';

interface TopPlayersListProps {
  title: string;
  players?: any[];
  statKey: 'goals' | 'assists' | 'cleanSheets' | 'yellowCards' | 'redCards';
  statLabel: string;
  /** Shown when there are no rows (defaults to a generic message) */
  emptyText?: string;
  onSeeAll?: () => void;
  onSelectPlayer?: (playerId: string, rawPlayer?: any) => void;
  maxDisplay?: number;
}

export function TopPlayersList({ title, players, statKey, statLabel, emptyText, onSeeAll, onSelectPlayer, maxDisplay }: TopPlayersListProps) {
  const router = useRouter();
  const hasData = players && players.length > 0;

  const filtered = hasData ? players.filter((p) => (p?.[statKey] || (p as any)?.stats?.[statKey] || 0) > 0) : [];
  const displayItems = maxDisplay ? filtered.slice(0, maxDisplay) : filtered;

  const list = displayItems.map((p, i) => {
    const playerObj = p?.playerId || {};
    const teamObj = p?.teamId || {};
    const firstName = playerObj?.firstName || '';
    const lastName = playerObj?.lastName || '';
    const fullName = playerObj?.displayName?.trim() || (firstName ? `${firstName} ${lastName}`.trim() : (p?.playerName || 'Player'));
    const teamName = teamObj?.name || teamObj?.shortName || '';

    return {
      id: playerObj?._id || p?._id,
      name: fullName,
      teamName,
      value: p?.[statKey] ?? (p as any)?.stats?.[statKey] ?? 0,
      photo: playerObj?.photoUrl || null,
      raw: p,
    };
  });

  if (list.length === 0) {
    return (
      <section className="mb-6 w-full rounded-2xl bg-[#1B1D25] px-6 py-10 text-center">
        <h2 className="mb-1 font-body text-[15px] font-semibold text-white">{title}</h2>
        <p className="font-body text-sm text-white/50">{emptyText ?? 'Nothing recorded yet.'}</p>
      </section>
    );
  }

  return (
    <section className="mb-6 w-full overflow-hidden rounded-2xl bg-[#1B1D25]">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h2 className="font-body text-[17px] font-semibold text-white">{title}</h2>
        {onSeeAll && (
          <button onClick={onSeeAll} className="font-body text-[13px] font-medium text-gaffer-orange">See all</button>
        )}
      </div>
      <div className="flex items-center gap-3 px-4 pb-1.5 font-body text-[12px] font-medium text-white/45">
        <span className="w-5 shrink-0 text-center">#</span>
        <span className="min-w-0 flex-1">Player</span>
        <span className="shrink-0 text-right">{statLabel}</span>
      </div>
      <ol>
        {list.map((player, i) => (
          <li key={player.id || i} className="border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => (onSelectPlayer ? onSelectPlayer(player.id, player.raw) : player.id && router.push(`/app/player/${player.id}`))}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left"
            >
              <span className={`w-5 shrink-0 text-center font-body text-[13px] tabular-nums ${i < 3 ? 'font-semibold text-white' : 'text-white/55'}`}>{i + 1}</span>
              <Avatar photoUrl={player.photo || undefined} size={36} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-body text-[15px] font-medium text-white">{player.name}</span>
                {player.teamName && <span className="truncate font-body text-[12px] text-white/50">{player.teamName}</span>}
              </span>
              <span className="shrink-0 font-body text-[17px] font-semibold tabular-nums text-white">{player.value}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
