/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#05060a',
          900: '#0a0c14',
          850: '#0d1018',
          800: '#11151f',
          700: '#161b27',
          600: '#1c2230',
          500: '#252c3c',
          400: '#3a4357',
        },
        gold: {
          50: '#fffaeb',
          100: '#fff1c6',
          200: '#ffe188',
          300: '#ffce4a',
          400: '#fbb821',
          500: '#e8a20c',
          600: '#c47d06',
          700: '#9a5b08',
          800: '#7c470b',
          900: '#663b0e',
        },
        emerald2: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        rose2: {
          400: '#fb7185',
          500: '#f43f5e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        '3d': '0 10px 40px -10px rgba(0,0,0,0.7), 0 4px 12px -4px rgba(0,0,0,0.5), inset 0 1px 0 0 rgba(255,255,255,0.05)',
        '3d-lg': '0 30px 80px -20px rgba(0,0,0,0.8), 0 10px 30px -10px rgba(0,0,0,0.6), inset 0 1px 0 0 rgba(255,255,255,0.06)',
        'glow-gold': '0 0 30px -5px rgba(251,184,33,0.4), 0 0 60px -20px rgba(251,184,33,0.2)',
        'glow-emerald': '0 0 30px -5px rgba(16,185,129,0.4)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255,255,255,0.08), inset 0 0 30px 0 rgba(0,0,0,0.4)',
      },
      backgroundImage: {
        'grid-dark': "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
        'radial-gold': 'radial-gradient(circle at 50% 0%, rgba(251,184,33,0.12), transparent 60%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'shimmer': 'shimmer 3s linear infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'ticker': 'ticker 30s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotateX(0deg)' },
          '50%': { transform: 'translateY(-20px) rotateX(2deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};
