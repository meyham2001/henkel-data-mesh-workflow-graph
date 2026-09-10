/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0b0d12',
        panel: '#141824',
        border: 'rgba(255, 255, 255, 0.09)',
        dim: '#a2a9bd',
        mute: '#6b7189',
        status: {
          ok: '#5cb87a',
          partial: '#e8b25e',
          missing: '#e8756a',
          unknown: '#a08ae0',
        },
        zone: {
          z1: '#1b1d30',
          z1c: '#242742',
          z1a: '#8b8fd6',
          z2: '#122238',
          z2c: '#1a2f4d',
          z2a: '#6aa9e8',
          z3: '#0f2b28',
          z3c: '#153b36',
          z3a: '#5cc9b0',
          z4: '#2b1719',
          z4c: '#3a1f22',
          z4a: '#e08a7a',
        },
      },
    },
  },
  plugins: [],
}
