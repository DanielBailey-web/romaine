const plugin = require("tailwindcss/plugin");
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "logo-purple": "#646079",
        "logo-blue": "#00adee",
      },
    },
  },
  plugins: [],
};
