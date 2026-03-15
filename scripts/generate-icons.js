#!/usr/bin/env node
/**
 * Generate GAFFER PWA icons
 * Run: node scripts/generate-icons.js
 * Requires: npm install canvas
 */

const { createCanvas } = require('canvas')
const fs = require('fs')
const path = require('path')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const outputDir = path.join(__dirname, '../public/icons')

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

sizes.forEach((size) => {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background
  const bg = ctx.createLinearGradient(0, 0, size, size)
  bg.addColorStop(0, '#1A1F2E')
  bg.addColorStop(1, '#0A0C10')
  ctx.fillStyle = bg
  ctx.roundRect(0, 0, size, size, size * 0.2)
  ctx.fill()

  // Orange circle accent
  const accentGrad = ctx.createLinearGradient(0, 0, size, size)
  accentGrad.addColorStop(0, '#FF6B00')
  accentGrad.addColorStop(1, '#CC2200')
  ctx.fillStyle = accentGrad
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size * 0.3, 0, Math.PI * 2)
  ctx.fill()

  // Letter G
  ctx.fillStyle = 'white'
  ctx.font = `bold ${size * 0.4}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('G', size / 2, size / 2)

  const buffer = canvas.toBuffer('image/png')
  fs.writeFileSync(path.join(outputDir, `icon-${size}x${size}.png`), buffer)
  console.log(`✓ Generated icon-${size}x${size}.png`)
})

console.log('\n✅ All icons generated successfully!')
