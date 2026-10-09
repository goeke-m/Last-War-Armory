/** @type {import('tailwindcss').Config} */
// Colors are CSS variables (space-separated RGB) defined in src/index.css for light and dark.
const v = name => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Saira Semi Condensed"', 'system-ui', 'sans-serif'],
        stencil: ['"Saira Stencil One"', '"Saira Semi Condensed"', 'sans-serif'],
      },
      colors: {
        ground: v('ground'),
        panel: v('panel'),
        raised: v('raised'),
        line: v('line'),
        'line-soft': v('line-soft'),
        ink: v('ink'),
        'ink-2': v('ink-2'),
        'ink-3': v('ink-3'),
        signal: v('signal'),
        'on-signal': v('on-signal'),
        accent: v('accent'),
        danger: v('danger'),
        ok: v('ok'),
        tank: v('tank'),
        air: v('air'),
        missile: v('missile'),
        'q-gold': v('q-gold'),
        'q-purple': v('q-purple'),
        'q-blue': v('q-blue'),
        'q-green': v('q-green'),
      },
      fontSize: {
        xs: ['0.8125rem', '1.15rem'],
        sm: ['0.9375rem', '1.3rem'],
        base: ['1rem', '1.45rem'],
      },
    },
  },
  plugins: [],
}
