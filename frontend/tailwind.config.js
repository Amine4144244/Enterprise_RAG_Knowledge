/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        // Apple system font stack for authentic typography
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          '"SF Pro Display"',
          'system-ui',
          'sans-serif',
        ],
        mono: [
          '"SF Mono"',
          'ui-monospace',
          'Menlo',
          'Monaco',
          'monospace'
        ]
      },
      colors: {
        // Apple HIG color palette
        apple: {
          blue: '#0071e3',
          'blue-hover': '#0077ed',
          gray: {
            50: '#f5f5f7',
            100: '#e8e8ed',
            200: '#d2d2d7',
            300: '#86868b',
            400: '#6e6e73',
            500: '#515154',
            800: '#1d1d1f',
            900: '#161617'
          }
        }
      },
      boxShadow: {
        // Soft diffuse Apple-style shadow
        'apple-sm': '0 2px 8px -1px rgba(0, 0, 0, 0.04), 0 1px 3px 0 rgba(0, 0, 0, 0.02)',
        'apple-md': '0 8px 24px -4px rgba(0, 0, 0, 0.08), 0 4px 12px 0 rgba(0, 0, 0, 0.03)',
        'apple-lg': '0 20px 40px -8px rgba(0, 0, 0, 0.12), 0 8px 16px 0 rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
