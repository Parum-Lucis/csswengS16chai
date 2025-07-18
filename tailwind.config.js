module.exports = {
  content: [
    "./**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      keyframes: {
        fade: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fade: 'fade 0.4s ease-in-out forwards',
      },
      fontFamily: {
        sans: ["Montserrat", "sans-serif"],
      },
      colors: {
        primary: "#75C38B",
        secondary: "#333333",
        tertiary: "#64A876",
        onhover: "#9BC1A5"
      },
    },
  },
};
