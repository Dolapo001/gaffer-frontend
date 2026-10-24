import type { FantasyRecap } from '@/lib/services/recap.service'
import { ordinal } from '@/lib/recapFormat'

const W = 1080
const H = 1920
const FONT = '"Chakra Petch", "Arial Black", Arial, sans-serif'

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, startSize: number, weight = 800): number {
  let size = startSize
  while (size > 24) {
    ctx.font = `${weight} ${size}px ${FONT}`
    if (ctx.measureText(text).width <= maxWidth) break
    size -= 4
  }
  return size
}

/** Draws the share picture (story size) for a recap and returns it as a PNG. */
export async function makeRecapImage(r: FantasyRecap): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not draw the picture on this device')

  // Wait for the app font if it is still loading, so the picture matches the app
  try { await document.fonts?.load(`800 64px "Chakra Petch"`) } catch { /* fall back to system font */ }

  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#121428')
  bg.addColorStop(0.55, '#1B1630')
  bg.addColorStop(1, '#3A1A08')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  const glow = ctx.createRadialGradient(W * 0.8, H * 0.28, 40, W * 0.8, H * 0.28, 620)
  glow.addColorStop(0, 'rgba(255,107,0,0.45)')
  glow.addColorStop(1, 'rgba(255,107,0,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  ctx.textAlign = 'left'
  ctx.fillStyle = '#FF6B00'
  ctx.font = `900 54px ${FONT}`
  ctx.fillText('GAFFER', 80, 150)

  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.font = `700 40px ${FONT}`
  ctx.fillText('FANTASY RECAP', 80, 270)
  ctx.fillStyle = '#FFFFFF'
  const tSize = fitText(ctx, r.tournament, W - 160, 76)
  ctx.font = `800 ${tSize}px ${FONT}`
  ctx.fillText(r.tournament, 80, 270 + tSize + 20)

  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  const nSize = fitText(ctx, r.managerName, W - 160, 56, 700)
  ctx.font = `700 ${nSize}px ${FONT}`
  ctx.fillText(r.managerName, 80, 560)
  ctx.fillStyle = 'rgba(255,255,255,0.45)'
  ctx.font = `600 38px ${FONT}`
  ctx.fillText(r.teamName, 80, 620)

  // The big number
  ctx.fillStyle = '#FFFFFF'
  const rankText = ordinal(r.rank)
  const rSize = fitText(ctx, rankText, W - 160, 380, 900)
  ctx.font = `900 ${rSize}px ${FONT}`
  ctx.fillText(rankText, 80, 1000)
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = `700 52px ${FONT}`
  ctx.fillText(`of ${r.managers} managers`, 80, 1090)

  ctx.fillStyle = '#FF6B00'
  ctx.font = `900 130px ${FONT}`
  ctx.fillText(`${r.totalPoints} pts`, 80, 1290)

  // Title pill
  ctx.font = `900 56px ${FONT}`
  const pillW = Math.min(W - 160, ctx.measureText(r.title).width + 90)
  ctx.fillStyle = '#FF6B00'
  ctx.beginPath()
  const px = 80, py = 1420, ph = 120, pr = 60
  ctx.moveTo(px + pr, py)
  ctx.arcTo(px + pillW, py, px + pillW, py + ph, pr)
  ctx.arcTo(px + pillW, py + ph, px, py + ph, pr)
  ctx.arcTo(px, py + ph, px, py, pr)
  ctx.arcTo(px, py, px + pillW, py, pr)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#111111'
  ctx.fillText(r.title, px + 45, py + 80)

  ctx.fillStyle = 'rgba(255,255,255,0.65)'
  ctx.font = `600 40px ${FONT}`
  ctx.fillText(r.titleLine, 80, 1620)

  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  ctx.font = `700 38px ${FONT}`
  ctx.fillText('the-gaffer.com.ng', 80, 1820)

  return await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not make the picture'))), 'image/png'))
}

/** Opens the phone's share sheet with the picture, or downloads it when sharing files is not possible. */
export async function shareRecapImage(r: FantasyRecap): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const blob = await makeRecapImage(r)
  const file = new File([blob], 'my-fantasy-recap.png', { type: 'image/png' })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: `My ${r.tournament} Fantasy recap`, text: `I finished ${ordinal(r.rank)} of ${r.managers} in ${r.tournament} Fantasy on Gaffer.` })
      return 'shared'
    } catch {
      return 'cancelled'
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'my-fantasy-recap.png'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
  return 'downloaded'
}
