/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
      extend: {
        colors: {
          dark: "#0B0F19",
          purple: "#7C3AED",
          cyan: "#38B2AC",
        },
        borderRadius: { '2xl': '1rem' }
      },
    },
    plugins: [],
  }
  