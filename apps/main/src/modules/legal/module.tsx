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
  <p className="text-muted-foreground px-6 text-center text-xs">
    By clicking continue, you agree to our{' '}
    <Link
      to="/terms-of-service"
      className="hover:text-primary underline underline-offset-4"
    >
      Terms of Service
    </Link>{' '}
    and{' '}
    <Link
      to="/privacy-policy"
      className="hover:text-primary underline underline-offset-4"
    >
      Privacy Policy
    </Link>
    .
  </p>
)
