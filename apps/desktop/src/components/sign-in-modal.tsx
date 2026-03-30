import { generateCodeChallenge, generateVerifier } from '@conar/shared/utils/challenge'
import { Button } from '@conar/ui/components/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@conar/ui/components/dialog'
import { RiLoginBoxLine } from '@remixicon/react'
import { skipToken, useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useSubscription } from 'seitu/react'
import { authClient, bearerToken, successAuthToast } from '~/lib/auth'
import { orpc } from '~/lib/orpc'
import { appStore, setIsSignInDialogOpen } from '~/store'

export function SignInModal() {
  const isOpen = useSubscription(appStore, { selector: state => state.isSignInDialogOpen })
  const [verifier, setVerifier] = useState<string | null>(null)
  const [codeChallenge, setCodeChallenge] = useState<string | null>(null)
  const { refetch } = authClient.useSession()

  useEffect(() => {
    if (!isOpen) {
      setVerifier(null)
      setCodeChallenge(null)
    }
  }, [isOpen])

  const startSignIn = async () => {
    const v = generateVerifier()
    const cc = await generateCodeChallenge(v)
    setVerifier(v)
    setCodeChallenge(cc)
    window.open(`${import.meta.env.VITE_PUBLIC_WEB_URL}/deep/sign-in?codeChallenge=${cc}`, '_blank')
  }

  const { data, isPending } = useQuery(orpc.account.challenge.listen.experimental_liveOptions({
    input: codeChallenge ? { codeChallenge } : skipToken,
    throwOnError: false,
  }))

  const { mutate: exchange } = useMutation(orpc.account.challenge.exchange.mutationOptions({
    onSuccess: (data) => {
      bearerToken.set(data.token)
      refetch()
      setIsSignInDialogOpen(false)
      successAuthToast(!!data.newUser)
    },
  }))

  useEffect(() => {
    if (!data?.ready || !codeChallenge || !verifier) {
      return
    }
    exchange({ codeChallenge, verifier })
  }, [data, exchange, codeChallenge, verifier])

  return (
    <Dialog open={isOpen} onOpenChange={setIsSignInDialogOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <RiLoginBoxLine className="size-4 text-primary" />
            </div>
            <DialogTitle className="font-semibold text-primary">Sign in required</DialogTitle>
          </div>
          <DialogDescription className="text-foreground">
            AI features are available after signing in. Your current data will be preserved.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => setIsSignInDialogOpen(false)} className="w-full sm:w-auto">
            Maybe Later
          </Button>
          <Button
            className="w-full sm:w-auto"
            disabled={!!codeChallenge && isPending}
            onClick={startSignIn}
          >
            {!!codeChallenge && isPending ? <span className="animate-pulse">Waiting for sign in...</span> : 'Sign In'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
