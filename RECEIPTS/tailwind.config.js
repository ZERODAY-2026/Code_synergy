/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: '#0A0C10',
        panel: '#12151C',
        text: '#E6EAF2',
        muted: '#7C8798',
        verified: '#35D07F',
        unconfirmed: '#F5A524',
        critical: '#FF5C5C',
        attack: '#8B7CF6',
        accent: '#22D3EE',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
