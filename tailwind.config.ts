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
        gaffer: {
          bg: '#0A0C10',
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
      },
      fontFamily: {
        display: ['var(--font-barlow-condensed)', 'sans-serif'],
        body: ['var(--font-barlow)', 'sans-serif'],
      },
      backgroundImage: {
        'orange-gradient': 'linear-gradient(135deg, #FF6B00 0%, #E53000 100%)',
        'orange-gradient-btn': 'linear-gradient(90deg, #FF6B00 0%, #CC2200 100%)',
        'dark-gradient': 'linear-gradient(180deg, rgba(10,12,16,0) 0%, rgba(10,12,16,0.85) 40%, #0A0C10 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 107, 0, 0.4)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(255, 107, 0, 0.2)' },
        },
      },
      boxShadow: {
        'orange-glow': '0 0 20px rgba(255, 107, 0, 0.3)',
        'card': '0 4px 24px rgba(0,0,0,0.4)',
        'input-focus': '0 0 0 2px rgba(255, 107, 0, 0.4)',
      },
    },
  },
  plugins: [],
}
export default config
