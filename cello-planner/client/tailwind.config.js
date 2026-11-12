/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Sage Green family
        sage: {
          50:  '#f4f7f4',
          100: '#e6ede6',
          200: '#c8d9c8',
          300: '#9dbc9d',
          400: '#6e9a6e',
          500: '#4a7c59',
          600: '#3a6347',
          700: '#2f4f38',
          800: '#263f2d',
          900: '#1e3324',
        },
        // Gold family
        gold: {
          50:  '#fdfbf0',
          100: '#faf5d9',
          200: '#f4e89f',
          300: '#edd55c',
          400: '#e6c02a',
          500: '#d4a017',
          600: '#b8800f',
          700: '#925f10',
          800: '#784c13',
          900: '#643f14',
        },
        // Cream / off-white
        cream: {
          50:  '#fefefe',
          100: '#fdf8f0',
          200: '#faf0e0',
          300: '#f5e6cc',
          400: '#edd9b0',
          500: '#e3c98e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'sage-gradient': 'linear-gradient(135deg, #4a7c59 0%, #2f4f38 100%)',
        'cream-gradient': 'linear-gradient(135deg, #fdf8f0 0%, #faf0e0 100%)',
        'gold-gradient': 'linear-gradient(135deg, #e6c02a 0%, #d4a017 100%)',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(74, 124, 89, 0.15)',
        'glass-lg': '0 16px 48px 0 rgba(74, 124, 89, 0.2)',
        'gold-glow': '0 4px 20px 0 rgba(212, 160, 23, 0.3)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
