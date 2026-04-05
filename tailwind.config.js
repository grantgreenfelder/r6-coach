/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── DOE brand palette ──────────────────────────────────────────────
        doe: {
          navy:  '#1a2744',   // seal outer ring
          gold:  '#c9a227',   // laurel / border accents
          red:   '#cc2229',   // shield stripe / ribbon
        },
        // ── UI surface scale (navy-shifted from pure black) ────────────────
        siege: {
          bg:      '#0a0f1a',   // deepest background (was #0d0d0d)
          surface: '#0e1726',   // top nav, footer (was #161616)
          card:    '#131f35',   // card backgrounds (was #1c1c1c)
          border:  '#1d2d47',   // borders, dividers (was #2a2a2a)
          accent:  '#c9a227',   // primary gold — DOE gold (was #e8a020)
          gold:    '#f0c040',   // secondary highlight gold
          red:     '#cc2229',   // DOE red (was #e03030)
          green:   '#30a050',
          blue:    '#3080e0',
          muted:   '#8a9099',
        },
      },
    },
  },
  plugins: [],
}
