import { SignIn } from '@clerk/clerk-react'

export default function App() {
  return (
    <header>
      <SignIn routing="path" path="/" />
    </header>
  )
}
