/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'apex-red': '#E10600',
        'apex-red-dark': '#B00500',
        'apex-bg': '#0D0D0D',
        'apex-surface': '#111111',
        'apex-card': '#1A1A1A',
        'apex-border': 'rgba(255,255,255,0.06)',
        'apex-text': '#FFFFFF',
        'apex-muted': '#808080',
        'apex-purple': '#9B59B6',
        'apex-green': '#1B7A1B',
        'apex-amber': '#F59E0B',
        'compound-soft': '#E8002D',
        'compound-medium': '#FFF200',
        'compound-hard': '#F0F0F0',
        'compound-inter': '#39B54A',
        'compound-wet': '#0067FF',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'monospace'],
        titillium: ['Titillium Web', 'sans-serif'],
      },
      boxShadow: {
        'carbon': 'inset 0 1px 0 rgba(255,255,255,0.05), 0 4px 16px rgba(0,0,0,0.6)',
        'button': '0 4px 0 #111, 0 5px 6px rgba(0,0,0,0.5)',
        'button-pressed': '0 1px 0 #111',
        'glow-red': '0 0 20px rgba(225,6,0,0.4)',
      },
      backgroundImage: {
        'carbon-fibre': 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)',
      },
    },
  },
  plugins: [],
}
