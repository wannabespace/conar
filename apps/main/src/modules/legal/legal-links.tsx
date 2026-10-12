import { Link } from '@tanstack/react-router'

export const Consent = () => (
  <p className="text-muted-foreground text-center text-xs text-balance">
    By clicking continue, you agree to our{' '}
    <Link
      to="/terms-of-service"
      className="text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
    >
      Terms of Service
    </Link>{' '}
    and{' '}
    <Link
      to="/privacy-policy"
      className="text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
    >
      Privacy Policy
    </Link>
    .
  </p>
)
