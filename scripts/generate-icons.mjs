import sharp from 'sharp'
import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512]

async function generateIcon(size) {
  const padding = Math.round(size * 0.1)
  const logoArea = size - padding * 2

  // Load the source logo
  const logoBuffer = readFileSync(join(root, 'public/images/logo.png'))

  // Resize logo to fit within the padded area (letterbox — keep aspect ratio)
  const resizedLogo = await sharp(logoBuffer)
    .resize(logoArea, Math.round(logoArea * 0.45), {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()

  // Get actual dimensions after resize
  const { width: logoW, height: logoH } = await sharp(resizedLogo).metadata()

  // Position: centre horizontally, centre vertically
  const left = Math.round((size - logoW) / 2)
  const top = Math.round((size - logoH) / 2)

  // Build circular mask
  const circleMask = Buffer.from(
    `<svg width="${size}" height="${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
    </svg>`
  )

  // Black square → composite logo → apply circular mask
  const iconBuffer = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 255 },
    },
  })
    .composite([{ input: resizedLogo, left, top }])
    .png()
    .toBuffer()

  // Apply circular clip via mask
  const clipped = await sharp(iconBuffer)
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toBuffer()

  const outPath = join(root, 'public/icons', `icon-${size}x${size}.png`)
  writeFileSync(outPath, clipped)
  console.log(`✓ icon-${size}x${size}.png`)
}

for (const size of sizes) {
  await generateIcon(size)
}

console.log('\nAll icons generated.')
