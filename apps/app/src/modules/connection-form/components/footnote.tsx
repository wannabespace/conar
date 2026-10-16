import { FieldDescription } from '@tamery/ui/components/field'
import type { ReactNode } from 'react'

export const Footnote = ({ children }: { children: ReactNode }) => (
  <div className="-mt-2 px-3">
    <FieldDescription size="sm">{children}</FieldDescription>
  </div>
)
