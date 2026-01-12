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

      {/* Thumbnail - type-based icon placeholder */}
      <Link href={`/shots/${shot.id}`} className="shot-card-thumbnail">
        <div className={`shot-card-thumbnail-placeholder shot-card-type-${shot.type}`}>
          {shot.type === 'feature' && (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          )}
          {shot.type === 'fix' && (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
            </svg>
          )}
          {shot.type === 'refactor' && (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="16 18 22 12 16 6"/>
              <polyline points="8 6 2 12 8 18"/>
            </svg>
          )}
          {shot.type === 'ui' && (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
          )}
          {shot.type === 'test' && (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="9 11 12 14 22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
          )}
          {shot.type === 'docs' && (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          )}
          {shot.type === 'other' && (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
        </div>
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
