/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#16130E',      // warm espresso background — never pure black
        coal: '#211B13',     // raised surface
        paper: '#F4EEE1',    // warm parchment text / inverted bands
        brass: '#E5A83B',    // single CTA + highlight accent
        panel: '#211B13',    // legacy alias (kept for existing classes)
        accent: '#E5A83B'    // legacy alias (kept for existing classes)
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
