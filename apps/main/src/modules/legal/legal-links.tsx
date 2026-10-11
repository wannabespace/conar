import { Link } from '@tanstack/react-router'

const footerLinkClassName =
  'text-muted-foreground hover:text-foreground text-sm transition-colors'

export const TermsLink = () => (
  <Link to="/terms-of-service" className={footerLinkClassName}>
    Terms of Service
  </Link>
)

export const PrivacyLink = () => (
  <Link to="/privacy-policy" className={footerLinkClassName}>
    Privacy Policy
  </Link>
)

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
