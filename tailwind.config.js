/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Colors resolve to CSS variables defined in style.css (light + .dark).
      colors: {
        surface: 'var(--surface)',
        'surface-alt': 'var(--surface-alt)',
        card: 'var(--card)',
        tint: 'var(--accent-tint)',
        accent: 'var(--accent)',
        gold: '#e8b04b',
        ink: 'var(--text)',
        body: 'var(--text-body)',
        muted: 'var(--text-muted)',
        faint: 'var(--text-faint)',
        hair: 'var(--border-hair)',
        'card-line': 'var(--border-card)',
        chunky: 'var(--border-chunky)',
        cat: 'var(--cat-bg)',
        'cat-line': 'var(--cat-border)',
        'cat-text': 'var(--cat-text)',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'],
        sans: ['Figtree', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        card: '18px',
        item: '12px',
        panel: '24px',
        tile: '12px',
      },
      boxShadow: {
        lift: '0 24px 60px -28px rgba(60,40,30,.35)',
        tactile: '2px 2px 0 var(--border-chunky)',
      },
      maxWidth: {
        content: '1180px',
      },
    },
  },
  plugins: [],
}
