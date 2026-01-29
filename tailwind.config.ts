import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    screens: {
      'xs': '420px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Light theme palette - soft pastels
        ivory: {
          50: "#FEFDFB",
          100: "#FDFBF7",
          200: "#FAF7F0",
          300: "#F7F3E9",
          400: "#F4EFE2",
          500: "#F1EBDC", // Primary ivory
        },
        beige: {
          50: "#FAF8F5",
          100: "#F5F1EA",
          200: "#EDE6D9",
          300: "#E5DBC8",
          400: "#DDD0B7",
          500: "#D5C5A6", // Primary beige
        },
        peach: {
          50: "#FFF8F5",
          100: "#FFF0EB",
          200: "#FFE1D6",
          300: "#FFD2C2",
          400: "#FFC3AD",
          500: "#FF9D7A", // Stronger warm peach
          600: "#FF8A5C",
          700: "#E67A4F",
        },
        gold: {
          50: "#FFFBF0",
          100: "#FFF7E0",
          200: "#FFEFC1",
          300: "#FFE7A2",
          400: "#FFD966",
          500: "#E6C259", // Stronger muted gold
          600: "#CCAA4D",
          700: "#B39241",
        },
        sage: {
          50: "#F5F7F4",
          100: "#EBEFE9",
          200: "#D7DFD3",
          300: "#C3CFBD",
          400: "#AFBFA7",
          500: "#8FA57A", // Stronger sage green
          600: "#7A9468",
          700: "#658356",
        },
        // Text colors for light theme
        text: {
          primary: "#2C2C2C",
          secondary: "#5A5A5A",
          tertiary: "#8A8A8A",
          light: "#B0B0B0",
        },
      },
      fontFamily: {
        serif: ['"Poppins"', '"DM Sans"', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', '"Poppins"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-soft': 'linear-gradient(135deg, #FFFBF0 0%, #FFF7E0 30%, #FEFDFB 60%, #FFFBF0 100%)',
        'gradient-warm': 'linear-gradient(135deg, #FFF8F5 0%, #FFE1D6 50%, #FFEFC1 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        'fade-in': 'fade-in 0.6s ease-out',
        'slide-up': 'slide-up 0.5s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      boxShadow: {
        'soft': '0 2px 15px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 4px 25px rgba(0, 0, 0, 0.1)',
        'soft-xl': '0 8px 35px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
};
export default config;
