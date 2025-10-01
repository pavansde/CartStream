// /** @type {import('tailwindcss').Config} */
// module.exports = {
//   content: [
//     "./src/**/*.{js,jsx,ts,tsx}", // make Tailwind scan all components
//   ],
//   theme: {
//     extend: {},
//   },
//   plugins: [],
// };

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'fadeInOut': 'fadeInOut 3s ease-in-out forwards',
        'fadeOut': 'fadeOut 3s ease-in-out forwards',
      },
      keyframes: {
        fadeInOut: {
          '0%': { 
            opacity: '0', 
            transform: 'translateY(-10px)' 
          },
          '20%': { 
            opacity: '1', 
            transform: 'translateY(0)' 
          },
          '80%': { 
            opacity: '1', 
            transform: 'translateY(0)' 
          },
          '100%': { 
            opacity: '0', 
            transform: 'translateY(-10px)' 
          },
        },
        fadeOut: {
          '0%': { 
            opacity: '1' 
          },
          '70%': { 
            opacity: '1' 
          },
          '100%': { 
            opacity: '0' 
          },
        }
      }
    },
  },
  plugins: [],
};