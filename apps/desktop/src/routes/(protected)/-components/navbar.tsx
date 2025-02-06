import { Button } from '@connnect/ui/components/button'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@connnect/ui/components/command'
import { useMutation } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useSession } from '~/hooks/use-session'
import { authClient, removeBearerToken } from '~/lib/auth'
import { queryClient } from '~/main'

export function Navbar() {
  const { refetch } = useSession()
  const [open, setOpen] = useState(false)

  const { mutate: signOut, isPending: isSigningOut } = useMutation({
    mutationFn: async () => {
      await Promise.all([removeBearerToken(), authClient.signOut()])
      await refetch()
      queryClient.invalidateQueries()
    },
    onSuccess: () => {
      toast.success('You have been signed out successfully.')
    },
  })

  return (
    <>
      <div className="flex h-10 justify-between">
        <div className="pl-20 [app-region:drag]" />
        <Button
          variant="ghost"
          onClick={() => setOpen(true)}
        >
          <Search />
        </Button>
        <Button
          loading={isSigningOut}
          onClick={() => signOut()}
        >
          Sign Out
        </Button>
      </div>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>Calendar</CommandItem>
            <CommandItem>Search Emoji</CommandItem>
            <CommandItem>Calculator</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
