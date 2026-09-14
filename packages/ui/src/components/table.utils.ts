import { cva } from 'class-variance-authority'

export const tableVariants = cva('w-full caption-bottom text-sm', {
  defaultVariants: {
    size: 'default',
  },
  variants: {
    size: {
      default: '',
      sm: 'text-xs [&_tbody_tr]:h-9 [&_td]:px-3 [&_th]:px-3',
    },
  },
})
