import { TextHoverEffect } from '@conar/ui/components/aceternity/text-hover-effect'
import { useRef } from 'react'

export function Footer() {
  const ref = useRef<SVGSVGElement>(null)

  return (
    <div className="container mx-auto">
      Footer
      <TextHoverEffect ref={ref} className="tracking-tighter" text="Conar" />
    </div>
  )
}
