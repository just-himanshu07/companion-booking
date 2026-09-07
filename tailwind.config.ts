import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paireva: {
          ivory: '#FFF8F5',
          blush: '#FFF0F3',
          plum: '#6D315D',
          'plum-hover': '#58264A',
          rose: '#E94B83',
          'rose-hover': '#D43770',
          coral: '#F47B8F',
          gold: '#D9A85C',
          espresso: '#292126',
          mauve: '#756A70',
          peach: '#FFD8C8',
          lavender: '#DCC7F5',
        },
        rentmate: {
          ivory: '#FFF8F5',
          blush: '#FFF0F3',
          plum: '#6D315D',
          'plum-hover': '#58264A',
          rose: '#E94B83',
          'rose-hover': '#D43770',
          coral: '#F47B8F',
          gold: '#D9A85C',
          espresso: '#292126',
          mauve: '#756A70',
          peach: '#FFD8C8',
          lavender: '#DCC7F5',
        },
        brand: {
          50: '#fff8f5',
          100: '#fff0f3',
          200: '#ffd8c8',
          300: '#f47b8f',
          500: '#e94b83',
          600: '#d43770',
          700: '#6d315d',
          800: '#58264a',
          900: '#292126',
        },
        rosebrand: {
          50: '#fff0f3',
          100: '#ffd8c8',
          500: '#e94b83',
          600: '#d43770',
          700: '#6d315d',
        }
      },
      fontFamily: {
        sans: ['var(--font-plus-jakarta)', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'romantic-gradient': 'linear-gradient(135deg, #FFD8C8 0%, #F6A6B8 50%, #DCC7F5 100%)',
        'blush-gradient': 'linear-gradient(180deg, #FFF8F5 0%, #FFF0F3 100%)',
        'plum-gradient': 'linear-gradient(135deg, #6D315D 0%, #4A1E3E 100%)',
      }
    },
  },
  plugins: [],
};
export default config;
