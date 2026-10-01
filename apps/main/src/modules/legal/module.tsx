import { Link } from '@tanstack/react-router'

import type { MainModule } from '~/lib/module'

const footerLinkClassName =
  'text-muted-foreground hover:text-foreground text-sm transition-colors'

const TermsLink = () => (
  <Link to="/terms-of-service" className={footerLinkClassName}>
    Terms of Service
  </Link>
)

const PrivacyLink = () => (
  <Link to="/privacy-policy" className={footerLinkClassName}>
    Privacy Policy
  </Link>
)

const Consent = () => (
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

export default {
  authFooter: [{ Component: Consent, order: 0 }],
  footerLinks: [
    { Component: TermsLink, order: 0 },
    { Component: PrivacyLink, order: 1 },
  ],
} satisfies MainModule
