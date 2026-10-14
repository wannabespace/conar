import { useCanGoBack, useNavigate, useRouter } from '@tanstack/react-router'

export const useGoBack = ({ ignoreBlocker = false } = {}) => {
  const router = useRouter()
  const navigate = useNavigate()
  const canGoBack = useCanGoBack()
  return () => {
    if (canGoBack) {
      router.history.back({ ignoreBlocker })
    } else {
      void navigate({ ignoreBlocker, to: '/' })
    }
  }
}
