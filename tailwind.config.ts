import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        lato : ['Lato'],
        inter : ['Inter']
      },
      colors: {
        'primary': '#FA6892',
        'primary-2': '#ec5873',
        'primary-dark': '#d2416c',
      }
    },
  },
  plugins: [],
}

