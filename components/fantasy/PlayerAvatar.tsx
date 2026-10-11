'use client'

import { initialsOf, readableTextOn } from '@/lib/playerDisplay'

interface Props {
  name: string
  /** A photo the player or organiser actually uploaded. Without one, initials on the team colour are shown. */
  photoUrl?: string
  teamColor?: string
  teamLogoUrl?: string
  teamCode?: string
  /** Pixel size of the circle */
  size?: number
  /** Show the little team badge in the bottom-left corner */
  showTeamBadge?: boolean
}

/**
 * A player's picture. Never a stock photo: with no upload it is the player's initials on their team's colour,
 * so no two teams look alike and nobody is shown as a stranger's face.
 */
export function PlayerAvatar({ name, photoUrl, teamColor = '#4a5568', teamLogoUrl, teamCode, size = 48, showTeamBadge = true }: Props) {
  const badge = Math.max(18, Math.round(size * 0.46))
  const text = readableTextOn(teamColor)
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <div className="w-full h-full rounded-full overflow-hidden border border-white/10 shadow-lg flex items-center justify-center" style={{ background: photoUrl ? '#2a2b3d' : teamColor }}>
        {photoUrl ? (
          <img src={photoUrl} alt={name} className="w-full h-full object-cover object-top" />
        ) : (
          <span aria-label={name} className="font-black tracking-tight select-none" style={{ color: text, fontSize: Math.round(size * 0.38) }}>
            {initialsOf(name)}
          </span>
        )}
      </div>

      {showTeamBadge && (teamLogoUrl || teamCode) && (
        <div
          className="absolute -bottom-0.5 -left-0.5 rounded-full border-2 border-[#1b1c2a] shadow-md overflow-hidden flex items-center justify-center bg-white"
          style={{ width: badge, height: badge }}
          title={teamCode}
        >
          {teamLogoUrl ? (
            <img src={teamLogoUrl} alt={teamCode ?? 'Team'} className="w-full h-full object-contain p-0.5" />
          ) : (
            <span className="font-black leading-none" style={{ fontSize: Math.round(badge * 0.36), color: readableTextOn(teamColor), background: teamColor, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {(teamCode ?? '').slice(0, 3)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
