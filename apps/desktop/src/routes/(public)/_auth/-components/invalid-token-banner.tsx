import { useNavigate } from '@tanstack/react-router'

export default function InvalidTokenBanner() {
  const navigate = useNavigate()

  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
      <p className="font-medium">This reset link is invalid or has expired.</p>
      <p className="mt-1 text-xs">
        Please request a new password reset link from
        {' '}
        <button
          type="button"
          onClick={() => navigate({ to: '/forgot-password' })}
          className="underline hover:no-underline cursor-pointer"
        >
          here
        </button>
        .
      </p>
    </div>
  )
}
