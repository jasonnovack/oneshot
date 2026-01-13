import { db } from '@/db'
import { requests, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { RequestUpvoteButton } from '@/components/RequestUpvoteButton'
import { RequestComments } from '@/components/RequestComments'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

const typeLabels: Record<string, string> = {
  model: 'Model',
  harness: 'Harness',
  hosting: 'Hosting',
  plugin: 'Plugin',
  other: 'Other',
}

const statusLabels: Record<string, string> = {
  open: 'Open',
  planned: 'Planned',
  completed: 'Completed',
  declined: 'Declined',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params

  const [result] = await db
    .select({
      request: requests,
      user: users,
    })
    .from(requests)
    .leftJoin(users, eq(requests.userId, users.id))
    .where(eq(requests.id, id))
    .limit(1)

  if (!result) {
    return { title: 'Request Not Found' }
  }

  const { request, user } = result
  const authorName = user ? `@${user.username}` : 'Anonymous'

  return {
    title: request.title,
    description: `${typeLabels[request.type]} request by ${authorName}: ${request.description.slice(0, 150)}...`,
  }
}

export default async function RequestDetailPage({ params }: Props) {
  const { id } = await params

  const [result] = await db
    .select({
      request: requests,
      user: users,
    })
    .from(requests)
    .leftJoin(users, eq(requests.userId, users.id))
    .where(eq(requests.id, id))
    .limit(1)

  if (!result) {
    notFound()
  }

  const { request, user } = result

  return (
    <article className="request-detail-page">
      {/* Header */}
      <header className="request-detail-header">
        <Link href="/requests" className="request-detail-back">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Requests
        </Link>

        <div className="request-detail-badges">
          <span className={`request-type-badge request-type-${request.type}`}>
            {typeLabels[request.type] || request.type}
          </span>
          <span className={`request-status-badge request-status-${request.status}`}>
            {statusLabels[request.status] || request.status}
          </span>
        </div>
      </header>

      {/* Title and Actions */}
      <div className="request-detail-title-row">
        <h1 className="request-detail-title">{request.title}</h1>
        <div className="request-detail-actions">
          <RequestUpvoteButton
            requestId={request.id}
            initialCount={request.upvoteCount || 0}
          />
        </div>
      </div>

      {/* Author */}
      <div className="request-detail-meta">
        {user ? (
          <Link href={`/u/${user.username}`} className="request-detail-author">
            {user.avatarUrl && (
              <img src={user.avatarUrl} alt="" className="request-detail-avatar" />
            )}
            <span>@{user.username}</span>
          </Link>
        ) : (
          <span className="request-detail-author-anon">Anonymous</span>
        )}
        <span className="request-detail-sep">·</span>
        <time className="request-detail-time">
          {new Date(request.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </time>
      </div>

      {/* Description */}
      <div className="request-detail-description">
        <p>{request.description}</p>
      </div>

      {/* Link */}
      {request.link && (
        <div className="request-detail-link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          <a href={request.link} target="_blank" rel="noopener noreferrer">
            {request.link}
          </a>
        </div>
      )}

      {/* Comments */}
      <section id="comments" className="request-detail-comments">
        <h2>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Comments ({request.commentCount || 0})
        </h2>
        <RequestComments requestId={request.id} />
      </section>
    </article>
  )
}
