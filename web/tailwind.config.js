/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // RIVER Brand Colors
        'big-red': '#FF1635',
        'pinky': '#FF1673',
        'purple': '#A100FF',
        'vista-blue': '#8599FF',

        // Dark Mode Backgrounds
        'deep-navy': '#000623',
        'dark-navy': '#000947',
        'night': '#0A0A0A',

        // Light Mode Backgrounds
        'lavender-white': '#F2EFFF',
        'lavender-mid': '#EAE4FF',
        'lavender-deep': '#DDD8FF',
        'lavender-dark': '#E4DCFF',

        // Light Mode Text
        'ink': '#0D0020',
        'slate': '#5A5270',
        'muted-purple': '#7A6A9A',
        'deep-purple': '#6B00CC',

        // Dark Mode Text (using opacity for rgba values)
        'muted': '#A3A3A3',
        'muted-slate': '#4A5580',
      },
      fontFamily: {
        'space': ['"Space Grotesk"', 'sans-serif'],
        'inter': ['Inter', 'sans-serif'],
        'mono': ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        'hero': 'clamp(2.5rem, 7vw, 5.5rem)',
        'section': 'clamp(2rem, 4vw, 3.5rem)',
      },
      letterSpacing: {
        'tight-display': '-0.03em',
        'mono-label': '0.10em',
        'mono-drawer': '0.14em',
      },
      boxShadow: {
        'card-dark': '0 4px 24px rgba(0,0,0,0.25), 0 1px 6px rgba(0,0,0,0.15)',
        'card-dark-hover': '0 16px 44px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.20)',
        'card-light': '0 4px 20px rgba(100,60,180,0.07), 0 1px 4px rgba(0,0,0,0.05)',
        'card-light-hover': '0 12px 36px rgba(100,60,180,0.12), 0 2px 8px rgba(0,0,0,0.06)',
      },
      borderRadius: {
        'card': '12px',
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(ellipse 70% 60% at 80% 20%, rgba(255,22,53,0.12) 0%, transparent 60%), radial-gradient(ellipse 50% 50% at 15% 80%, rgba(161,0,255,0.10) 0%, transparent 55%), #000623',
      },
    },
  },
  plugins: [],
}
