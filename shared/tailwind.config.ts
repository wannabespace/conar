import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

export default <Omit<Config, 'content'>>{
  darkMode: ['class'],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        primary: '#7942F1',
      },
    },
  },
  plugins: [animate],
}
