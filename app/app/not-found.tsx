import { redirect } from 'next/navigation'

export default function NotFound() {
  redirect('/app')

  return null
}
