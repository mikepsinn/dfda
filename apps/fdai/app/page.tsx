import { redirect } from 'next/navigation'

export default function Home() {
  // You can change this redirect to any default page you prefer
  redirect('/admin')
} 