// https://nuxt.com/docs/api/configuration/nuxt-config

export default defineNuxtConfig({
  devtools: {
    enabled: true,
    timeline: {
      enabled: true,
    },
  },
  colorMode: {
    classSuffix: '',
  },
  modules: [
    '@nuxtjs/tailwindcss',
    'nuxt-vuefire',
    'nuxt-icon',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxtjs/color-mode',
    '@vue-macros/nuxt',
  ],
  vuefire: {
    config: {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      measurementId: process.env.FIREBASE_MEASUREMENT_ID,
    },
  },
  css: ['~/assets/css/main.css'],
  app:{
    head:{
      htmlAttrs: {
        lang: 'en'
      },
      meta: [
        { name: "viewport", content: "viewport-fit=cover, width=device-width, initial-scale=1"},
        { name: "format-detection", content: "telephone=no" },
        { name: "msapplication-tap-highlight", content: "no" },
        { name: "apple-mobile-web-app-capable", content: "yes" },
        { name: "apple-mobile-web-app-title", content: "Monitor Suhu 2" },
        { name: "apple-mobile-web-app-status-bar-style", content: "black" },
        { name: "theme-color", content: "#2d001d" },
      ],
      link: [
        {rel: "shortcut icon", type: "image/svg+xml", href: "/img/logo-fav.svg"},
      ]
    }
  },
})