'use client'

import Link from 'next/link'
import { RequestUpvoteButton } from './RequestUpvoteButton'

interface RequestCardProps {
  request: {
    id: string
    type: string
    title: string
    description: string
    status: string
    upvoteCount: number | null
    commentCount: number | null
    createdAt: Date
  }
  user: {
    id: string
    username: string
    avatarUrl: string | null
  } | null
  relativeTime: string
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

export function RequestCard({ request, user, relativeTime }: RequestCardProps) {
  return (
    <article className="request-card">
      {/* Upvote Column */}
      <div className="request-card-upvote">
        <RequestUpvoteButton
          requestId={request.id}
          initialCount={request.upvoteCount || 0}
        />
      </div>

      {/* Content */}
      <div className="request-card-content">
        <div className="request-card-header">
          <span className={`request-type-badge request-type-${request.type}`}>
            {typeLabels[request.type] || request.type}
          </span>
          {request.status !== 'open' && (
            <span className={`request-status-badge request-status-${request.status}`}>
              {statusLabels[request.status] || request.status}
            </span>
          )}
        </div>

        <Link href={`/requests/${request.id}`} className="request-card-title">
          <h3>{request.title}</h3>
        </Link>

        <p className="request-card-description">
          {request.description.length > 150
            ? `${request.description.slice(0, 150)}...`
            : request.description}
        </p>

        <div className="request-card-meta">
          {/* Author */}
          {user ? (
            <Link href={`/u/${user.username}`} className="request-card-author">
              {user.avatarUrl && (
                <img src={user.avatarUrl} alt="" className="request-card-avatar" />
              )}
              <span>@{user.username}</span>
            </Link>
          ) : (
            <span className="request-card-author-anon">Anonymous</span>
          )}

          <span className="request-card-sep">·</span>
          <span className="request-card-time">{relativeTime}</span>

          {/* Comments */}
          <Link href={`/requests/${request.id}#comments`} className="request-card-comments">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>{request.commentCount || 0}</span>
          </Link>
        </div>
      </div>
    </article>
  )
}
