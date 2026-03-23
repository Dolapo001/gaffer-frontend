'use client'

import { type FantasySquadPlayer, getJerseyUrl } from '@/lib/fantasyMockData'
import { PitchPlayerCard } from './PitchPlayerCard'
import { EmptySlotCard } from './EmptySlotCard'

// ─── Pitch SVG markings ───────────────────────────────────────────────────────

// ─── Pitch SVG markings ───────────────────────────────────────────────────────

function PitchMarkings() {
  return (
    <svg
      viewBox="0 0 329 402"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* Background with opacity to show underlying image */}
      <rect width="329" height="402" fill="#4F7429" fillOpacity="1" />

      <g clipPath="url(#clip0_pitch_layout)">
        {/* Grass stripe bands */}
        <rect opacity="0.07" y="7" width="329" height="42.1111" fill="black" />
        <rect opacity="0.07" y="91.2222" width="329" height="42.1111" fill="black" />
        <rect opacity="0.07" y="175.444" width="329" height="42.1111" fill="black" />
        <rect opacity="0.07" y="259.667" width="329" height="42.1111" fill="black" />
        <rect opacity="0.07" y="343.889" width="329" height="42.1111" fill="black" />

        {/* Penalty area (top) */}
        <path
          d="M250.809 33.2852L265.555 72.4229H63.5635L81.6396 33.2852H250.809Z"
          stroke="white"
          strokeWidth="2"
        />

        {/* Outer field boundary */}
        <path
          d="M344.992 101.749L339.03 293.21H-6.02539L-10.9941 100.21L23.6104 33.2803L311.866 31.2061L344.992 101.749Z"
          stroke="white"
          strokeWidth="2"
        />

        {/* Centre circle (ellipse in perspective) */}
        <path
          d="M166.5 246.263C190.167 246.263 211.519 251.811 226.902 260.701C242.325 269.614 251.477 281.7 251.478 294.73C251.478 307.761 242.325 319.847 226.902 328.76C211.519 337.65 190.167 343.197 166.5 343.197C142.833 343.197 121.481 337.65 106.098 328.76C90.6748 319.847 81.5225 307.761 81.5225 294.73C81.5226 281.7 90.675 269.614 106.098 260.701C121.481 251.811 142.833 246.263 166.5 246.263Z"
          stroke="white"
          strokeWidth="3.04583"
        />

        {/* Right corner arc */}
        <mask id="path-9-inside-1_pitch" fill="white">
          <path d="M319.034 43.3505C316.742 44.5665 314.177 45.1768 311.583 45.1234C308.989 45.0701 306.452 44.3549 304.212 43.0458C301.972 41.7366 300.104 39.8769 298.784 37.6429C297.464 35.409 296.737 32.875 296.672 30.2813L311.896 29.8975L319.034 43.3505Z" />
        </mask>
        <path
          d="M319.034 43.3505C316.742 44.5665 314.177 45.1768 311.583 45.1234C308.989 45.0701 306.452 44.3549 304.212 43.0458C301.972 41.7366 300.104 39.8769 298.784 37.6429C297.464 35.409 296.737 32.875 296.672 30.2813L311.896 29.8975L319.034 43.3505Z"
          stroke="white"
          strokeWidth="4"
          mask="url(#path-9-inside-1_pitch)"
        />

        {/* Left corner arc */}
        <mask id="path-10-inside-2_pitch" fill="white">
          <path d="M15.6985 46.2899C17.9904 47.5059 20.5551 48.1162 23.149 48.0629C25.743 48.0096 28.2804 47.2944 30.5204 45.9852C32.7605 44.6761 34.6289 42.8163 35.9484 40.5824C37.268 38.3485 37.995 35.8145 38.0603 33.2208L22.836 32.8369L15.6985 46.2899Z" />
        </mask>
        <path
          d="M15.6985 46.2899C17.9904 47.5059 20.5551 48.1162 23.149 48.0629C25.743 48.0096 28.2804 47.2944 30.5204 45.9852C32.7605 44.6761 34.6289 42.8163 35.9484 40.5824C37.268 38.3485 37.995 35.8145 38.0603 33.2208L22.836 32.8369L15.6985 46.2899Z"
          stroke="white"
          strokeWidth="4"
          mask="url(#path-10-inside-2_pitch)"
        />

        {/* Goal area (6-yard box) */}
        <path
          d="M215.401 33.0352L220.059 53.4053H108.073L115.524 33.0352H215.401Z"
          stroke="white"
          strokeWidth="1.5"
        />

        {/* Goal mouth */}
        <path
          d="M195.5 10.9146V32.8267H137.5V10.9146H195.5Z"
          stroke="white"
        />

        {/* Penalty arc (D-shape at top) */}
        <mask id="path-13-inside-3_pitch" fill="white">
          <path d="M115.001 72.9014C123.896 80.563 143.832 85.9013 167 85.9014C190.168 85.9014 210.105 80.5631 219 72.9014L115.001 72.9014Z" />
        </mask>
        <path
          d="M115.001 72.9014L114.158 73.8804L111.521 71.6092H115.001V72.9014ZM167 85.9014V87.1935L167 87.1935L167 85.9014ZM219 72.9014V71.6092H222.48L219.843 73.8804L219 72.9014ZM115.001 72.9014L115.844 71.9223C120.076 75.567 127.064 78.7526 135.967 81.0224C144.843 83.2849 155.51 84.6092 167 84.6092L167 85.9014L167 87.1935C155.322 87.1935 144.437 85.8486 135.329 83.5266C126.249 81.2117 118.821 77.8974 114.158 73.8804L115.001 72.9014ZM167 85.9014V84.6092C178.49 84.6092 189.158 83.285 198.033 81.0224C206.937 78.7527 213.925 75.567 218.157 71.9223L219 72.9014L219.843 73.8804C215.18 77.8975 207.752 81.2118 198.672 83.5266C189.563 85.8487 178.678 87.1935 167 87.1935V85.9014ZM219 72.9014V74.1935L115.001 74.1935V72.9014V71.6092L219 71.6092V72.9014Z"
          fill="white"
          mask="url(#path-13-inside-3_pitch)"
        />
      </g>

      <defs>
        <clipPath id="clip0_pitch_layout">
          <rect width="329" height="402" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

interface PitchLayoutProps {
  pitchPlayers: FantasySquadPlayer[]
  selectedId: string | null
  substitutingOutId?: string | null
  budget: number
  onSelectPlayer: (id: string) => void
  selectionMode?: boolean
}

export function PitchLayout({
  pitchPlayers,
  selectedId,
  substitutingOutId,
  budget,
  onSelectPlayer,
  selectionMode = false,
}: PitchLayoutProps) {
  // Define fixed slots for selection mode
  // Row 3: GK (2 slots)
  // Row 2: DEF (5 slots)
  // Row 1: MID (5 slots)
  // Row 0: FWD (3 slots)
  const slotConfig = [
    { row: 3, count: 2, position: 'GK' },
    { row: 2, count: 5, position: 'DEF' },
    { row: 1, count: 5, position: 'MID' },
    { row: 0, count: 3, position: 'FWD' },
  ]

  const rows = [3, 2, 1, 0].map((row) => {
    const playersInRow = pitchPlayers.filter((p) => p.pitchRow === row)
    const config = slotConfig.find((c) => c.row === row)
    return {
      row,
      players: playersInRow,
      totalSlots: config?.count || 0,
      position: config?.position || '',
    }
  })

  return (
    <div className="relative w-full aspect-[4/5]">
      <PitchMarkings />

      {/* Player rows */}
      <div className="absolute inset-0 flex flex-col justify-center gap-[14px] pt-8 pb-12 px-2">
        {rows.map((rowData, ri) => (
          <div key={ri} className="flex flex-row justify-center gap-2 sm:gap-4 w-full">
            {selectionMode ? (
              // In selection mode, we show all slots
              Array.from({ length: rowData.totalSlots }).map((_, si) => {
                const player = rowData.players[si]
                if (player) {
                  return (
                    <PitchPlayerCard
                      key={player.id}
                      playerName={player.shortName}
                      fixture={player.nextFixtures[0] ? `${player.nextFixtures[0].awayCode === player.teamCode ? player.nextFixtures[0].homeCode : player.nextFixtures[0].awayCode} (${player.nextFixtures[0].homeCode === player.teamCode ? 'H' : 'A'})` : player.teamCode}
                      kitImageUrl={getJerseyUrl(player.teamCode, player.position)}
                      points={player.points}
                      selected={selectedId === player.id}
                      highlightMode={substitutingOutId === player.id ? 'sub_out' : 'none'}
                      onClick={() => onSelectPlayer(player.id)}
                      status={player.status || 'fit'}
                      captaincy={player.isCaptain ? 'C' : player.isViceCaptain ? 'V' : null}
                    />
                  )
                }
                return (
                  <EmptySlotCard 
                    key={`empty-${rowData.row}-${si}`} 
                    position={rowData.position}
                    onClick={() => {
                        // We need a way to tell the parent WHICH slot was clicked
                        // For now, just call onSelectPlayer with a special prefix
                        onSelectPlayer(`empty-${rowData.position}-${si}`)
                    }}
                  />
                )
              })
            ) : (
              // In normal mode, only show players
              rowData.players.map((player) => (
                <PitchPlayerCard
                  key={player.id}
                  playerName={player.shortName}
                      fixture={player.nextFixtures[0] ? `${player.nextFixtures[0].awayCode === player.teamCode ? player.nextFixtures[0].homeCode : player.nextFixtures[0].awayCode} (${player.nextFixtures[0].homeCode === player.teamCode ? 'H' : 'A'})` : player.teamCode}
                  kitImageUrl={getJerseyUrl(player.teamCode, player.position)}
                  points={player.points}
                  selected={selectedId === player.id}
                  highlightMode={substitutingOutId === player.id ? 'sub_out' : 'none'}
                  onClick={() => onSelectPlayer(player.id)}
                  status={player.status || 'fit'} 
                  captaincy={player.isCaptain ? 'C' : player.isViceCaptain ? 'V' : null}
                />
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
