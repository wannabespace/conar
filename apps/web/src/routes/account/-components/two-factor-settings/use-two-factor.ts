import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { authClient } from '~/lib/auth'
import { handleError } from '~/utils/error'

export function useTwoFactorSetup() {
  const queryClient = useQueryClient()
  const [totpUri, setTotpUri] = useState('')

  const enableTotp = useMutation({
    mutationKey: ['two-factor', 'enable'],
    mutationFn: async (password: string) => {
      const { data, error } = await authClient.twoFactor.enable({ password })
      if (error) {
        throw error
      }
      return data
    },
    onSuccess: ({ totpURI }) => {
      setTotpUri(totpURI)
    },
    onError: handleError,
  })

  const verifyTotp = useMutation({
    mutationKey: ['two-factor', 'verify-setup'],
    mutationFn: async (code: string) => {
      const { error } = await authClient.twoFactor.verifyTotp({ code })
      if (error) {
        throw error
      }
    },
    onSuccess: async () => {
      toast.success('2FA enabled')
      await queryClient.invalidateQueries({ queryKey: ['session'] })
    },
    onError: handleError,
  })

  const reset = () => {
    setTotpUri('')
  }

  return { totpUri, enableTotp, verifyTotp, reset }
}

export function useTwoFactorDisable() {
  const queryClient = useQueryClient()

  const disableTotp = useMutation({
    mutationKey: ['two-factor', 'disable'],
    mutationFn: async (password: string) => {
      const { error } = await authClient.twoFactor.disable({ password })
      if (error) {
        throw error
      }
    },
    onSuccess: async () => {
      toast.success('2FA disabled')
      await queryClient.invalidateQueries({ queryKey: ['session'] })
    },
    onError: handleError,
  })

  return { disableTotp }
}
