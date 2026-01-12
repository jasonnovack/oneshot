'use client'

import Link from 'next/link'
import { UpvoteButton } from './UpvoteButton'

interface ShotCardProps {
  shot: {
    id: string
    title: string
    harness: string
    type: string
    model: string
    afterPreviewUrl: string | null
    starCount: number | null
    commentCount: number | null
  }
  user: {
    username: string
    avatarUrl: string | null
  } | null
  diffStats: {
    filesChanged: number
    additions: number
    deletions: number
  }
  relativeTime: string
  harnessDisplay: string
}

export function ShotCard({ shot, user, diffStats, relativeTime, harnessDisplay }: ShotCardProps) {
  return (
    <article className="shot-card-v2">
      {/* Upvote Column */}
      <div className="shot-card-upvote">
        <UpvoteButton shotId={shot.id} initialCount={shot.starCount || 0} size="small" />
      </div>

      {/* Thumbnail */}
      <Link href={`/shots/${shot.id}`} className="shot-card-thumbnail">
        {shot.afterPreviewUrl ? (
          <img
            src={`https://s.wordpress.com/mshots/v1/${encodeURIComponent(shot.afterPreviewUrl)}?w=400`}
            alt=""
            loading="lazy"
          />
        ) : (
          <div className={`shot-card-thumbnail-placeholder shot-card-type-${shot.type}`}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="shot-card-content">
        <div className="shot-card-main">
          <Link href={`/shots/${shot.id}`} className="shot-card-title">
            <h3>{shot.title}</h3>
          </Link>
          <p className="shot-card-tagline">
            <span className="shot-card-stats-inline">
              <span className="stat-add">+{diffStats.additions}</span>
              <span className="stat-remove">-{diffStats.deletions}</span>
            </span>
            across {diffStats.filesChanged} {diffStats.filesChanged === 1 ? 'file' : 'files'}
          </p>
        </div>

        <div className="shot-card-meta">
          {/* Author */}
          {user ? (
            <Link href={`/u/${user.username}`} className="shot-card-author">
              {user.avatarUrl && (
                <img src={user.avatarUrl} alt="" className="shot-card-avatar" />
              )}
              <span>@{user.username}</span>
            </Link>
          ) : (
            <span className="shot-card-author-anon">Anonymous</span>
          )}

          <span className="shot-card-sep">·</span>
          <span className="shot-card-time">{relativeTime}</span>

          {/* Pills */}
          <div className="shot-card-pills">
            <span className="shot-card-pill shot-card-pill-harness">{harnessDisplay}</span>
            <span className="shot-card-pill shot-card-pill-type">{shot.type}</span>
          </div>

          {/* Comments */}
          <Link href={`/shots/${shot.id}#comments`} className="shot-card-comments">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>{shot.commentCount || 0}</span>
          </Link>
        </div>
      </div>
    </article>
  )
}
