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
      }
    },
  },
  plugins: [],
}

