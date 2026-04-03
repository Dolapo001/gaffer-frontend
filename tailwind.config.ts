import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-base': '#181928',
        'bg-surface': '#131720',
        'bg-card': '#1A1F2E',
        'border-gaffer': '#252D3D',
        'orange-gaffer': '#FF6B00',
        'orange-light': '#FF8533',
        'red-accent': '#E53000',
        'text-primary': '#FFFFFF',
        'text-muted': '#8892A4',
        'text-subtle': '#4A5568',
        gaffer: {
          bg: '#181928',
          surface: '#131720',
          card: '#1A1F2E',
          border: '#252D3D',
          orange: '#FF6B00',
          'orange-light': '#FF8533',
          red: '#E53000',
          'gradient-start': '#FF6B00',
          'gradient-end': '#CC2200',
          text: '#FFFFFF',
          muted: '#8892A4',
          subtle: '#4A5568',
        },
        // ── PlayerCard design tokens ─────────────────────────────────────────
        pitch: {
          'kit-bg': '#6A7B51',
          'pl-purple': '#37003c',
          'fixture-bg': '#f4f0f5',
        },
      },
      fontFamily: {
        display: ['var(--font-barlow-condensed)', 'Barlow Condensed', 'sans-serif'],
        body: ['var(--font-barlow)', 'Barlow', 'sans-serif'],
        chakra: ['var(--font-chakra)', 'Chakra Petch', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #FF6B00, #CC2200)',
        'orange-gradient': 'linear-gradient(135deg, #FF6B00 0%, #E53000 100%)',
        'orange-gradient-btn': 'linear-gradient(90deg, #FF6B00 0%, #CC2200 100%)',
        'glow-overlay': 'radial-gradient(ellipse at center, rgba(255,107,0,0.15), transparent 70%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite linear',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 107, 0, 0.2)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(255, 107, 0, 0.1)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      boxShadow: {
        'orange-glow': '0 0 20px rgba(255, 107, 0, 0.3)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
      },
      backdropFilter: {
        'glass': 'blur(12px)',
      },
    },
  },
  plugins: [],
}
export default config
