import type { Config } from 'tailwindcss'

export const theme: Config['theme'] = {
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
}
