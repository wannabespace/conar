import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router'

export const useGoBack = () => {
  const router = useRouter()
  const navigate = useNavigate()
  const canGoBack = useCanGoBack()
  return () => {
    if (canGoBack) {
      router.history.back()
    } else {
      void navigate({ to: '/' })
    }
  }
}
