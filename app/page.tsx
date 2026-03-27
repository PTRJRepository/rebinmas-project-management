import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to user filter page first
  redirect('/user-filter')
}
