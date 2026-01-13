import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { RequestForm } from '@/components/RequestForm'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'New Feature Request',
  description: 'Submit a request for new models, harnesses, hosting services, plugins, and more.',
}

export default async function NewRequestPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect('/api/auth/signin?callbackUrl=/requests/new')
  }

  return (
    <div className="new-request-page">
      <header className="new-request-header">
        <Link href="/requests" className="new-request-back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Requests
        </Link>
        <h1>New Feature Request</h1>
        <p>Request a new model, harness, hosting service, plugin, or suggest something else.</p>
      </header>

      <RequestForm />
    </div>
  )
}
