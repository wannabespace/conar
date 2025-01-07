import { Button } from '@connnect/ui/components/button'
import { Checkbox } from '@connnect/ui/components/checkbox'
import { Input } from '@connnect/ui/components/input'
import { Label } from '@connnect/ui/components/label'
import { zodResolver } from '@hookform/resolvers/zod'
import { RiEyeLine, RiEyeOffLine } from '@remixicon/react'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { authClient } from '~/lib/auth'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false)

  const { handleSubmit, register } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = handleSubmit(async ({ email, password }) => {
    const { error } = await authClient.signIn.email({
      email,
      password,
    })

    if (error) {
      throw error
    }
  })

  return (
    <form onSubmit={onSubmit}>
      <Label>
        Email
        <Input
          placeholder="slash@getjustd.com"
          type="email"
          autoCapitalize="none"
          autoComplete="email"
          spellCheck="false"
          {...register('email')}
        />
      </Label>

      <div className="space-y-2">
        <label className="text-sm font-medium leading-none" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <Input
            id="password"
            placeholder="shhh, don't tell anyone"
            type={showPassword ? 'text' : 'password'}
            autoCapitalize="none"
            autoComplete="new-password"
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 size-7 -translate-y-1/2"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword
              ? (
                  <RiEyeOffLine className="size-4" />
                )
              : (
                  <RiEyeLine className="size-4" />
                )}
            <span className="sr-only">
              {showPassword ? 'Hide password' : 'Show password'}
            </span>
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox id="terms" />
        <label
          htmlFor="terms"
          className="text-muted-foreground text-sm leading-none"
        >
          I agree to the
          {' '}
          <Link href="#" className="underline">
            Terms and Conditions
          </Link>
          {' '}
          and
          {' '}
          <Link href="#" className="underline">
            Privacy Policy
          </Link>
        </label>
      </div>

      <Button className="w-full" size="lg">
        Get started
      </Button>
    </form>
  )
}
