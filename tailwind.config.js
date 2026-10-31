/** @type {import('tailwindcss').Config} */
module.exports = {
content: [
  './layout/**/*.liquid',
  './templates/**/*.liquid',
  './sections/**/*.liquid',
  './snippets/**/*.liquid',
  './assets/**/*.js',
  './assets/**/*.css',
  './config/**/*.json'
],

  prefix: 'tw-',

  corePlugins: {
    preflight: false, // keeps Dawn intact
  },

    theme: {
    extend: {
      fontFamily: {
        integral: ['"Integral CF"', 'sans-serif'],
        satoshi: ['"Satoshi"', 'sans-serif'],
        cormorant: ['"Cormorant Garamond"', 'serif'],
        playfair: ['"Playfair Display"', 'serif'],
      }
    },
  },

  plugins: [],
}