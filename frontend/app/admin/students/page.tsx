import { redirect } from 'next/navigation'

export default function AdminStudentsRemoved() {
  // This route has been removed — redirect to the landing page
  redirect('/landing-page')
}
