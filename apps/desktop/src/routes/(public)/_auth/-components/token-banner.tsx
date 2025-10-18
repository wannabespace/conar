interface InvalidTokenBannerProps {
  onNavigate: () => void
}

export default function InvalidTokenBanner({ onNavigate }: InvalidTokenBannerProps) {
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
      <p className="font-medium">This reset link is invalid or has expired.</p>
      <p className="mt-1 text-xs">
        Please request a new password reset link from
        {' '}
        <button
          type="button"
          onClick={onNavigate}
          className="underline hover:no-underline cursor-pointer"
        >
          here
        </button>
        .
      </p>
    </div>
  )
}
