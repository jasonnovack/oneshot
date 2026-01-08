import { db } from '@/db'
import { shots, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { UpvoteButton } from '@/components/UpvoteButton'
import { ShareButton } from '@/components/ShareButton'
import { Comments } from '@/components/Comments'
import { RecipePanel } from '@/components/RecipePanel'

// Helper to compute diff stats from raw diff text
function computeDiffStats(diff: string) {
  const lines = diff.split('\n')
  let filesChanged = 0
  let additions = 0
  let deletions = 0

  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      filesChanged++
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      additions++
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      deletions++
    }
  }

  return { filesChanged, additions, deletions }
}

// Helper to extract generation time from session data
function extractGenerationTime(sessionData: string | null): number | null {
  if (!sessionData) return null
  try {
    const data = JSON.parse(sessionData)
    if (data.generationTimeMs) {
      return data.generationTimeMs
    }
    if (data.tokenUsage?.totalTokens) {
      return Math.round(data.tokenUsage.totalTokens / 50 * 1000)
    }
    return null
  } catch {
    return null
  }
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.round((ms % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

// Format harness name for display
function formatHarness(harness: string): string {
  const names: Record<string, string> = {
    claude_code: 'Claude Code',
    cursor: 'Cursor',
    codex: 'Codex CLI',
  }
  return names[harness] || harness
}

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ShotDetailPage({ params }: Props) {
  const { id } = await params

  const [result] = await db
    .select({
      shot: shots,
      user: users,
    })
    .from(shots)
    .leftJoin(users, eq(shots.userId, users.id))
    .where(eq(shots.id, id))
    .limit(1)

  if (!result) {
    notFound()
  }

  const { shot, user } = result
  const diffStats = computeDiffStats(shot.diff)
  const generationTime = extractGenerationTime(shot.sessionData)

  return (
    <article className="shot-detail-page">
      {/* Hero Section with Preview */}
      {shot.afterPreviewUrl && (
        <section className="shot-hero">
          <div className="shot-hero-images">
            {shot.beforePreviewUrl && (
              <div className="shot-hero-image shot-hero-before">
                <span className="shot-hero-badge">Before</span>
                <a href={shot.beforePreviewUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={`https://image.thum.io/get/width/900/${shot.beforePreviewUrl}`}
                    alt="Before preview"
                    loading="eager"
                  />
                </a>
              </div>
            )}
            <div className="shot-hero-image shot-hero-after">
              <span className="shot-hero-badge">{shot.beforePreviewUrl ? 'After' : 'Preview'}</span>
              <a href={shot.afterPreviewUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={`https://image.thum.io/get/width/900/${shot.afterPreviewUrl}`}
                  alt="After preview"
                  loading="eager"
                />
              </a>
            </div>
          </div>
        </section>
      )}

      {/* Title and Actions Bar */}
      <header className="shot-title-bar">
        <div className="shot-title-content">
          <h1>{shot.title}</h1>
          <div className="shot-byline">
            {user ? (
              <Link href={`/u/${user.username}`} className="shot-author">
                {user.avatarUrl && (
                  <img src={user.avatarUrl} alt="" className="shot-author-avatar" />
                )}
                <span className="shot-author-name">@{user.username}</span>
              </Link>
            ) : (
              <span className="shot-author-anon">Anonymous</span>
            )}
            <span className="shot-byline-sep">·</span>
            <time className="shot-timestamp">
              {new Date(shot.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </time>
          </div>
        </div>
        <div className="shot-title-actions">
          <UpvoteButton shotId={shot.id} initialCount={shot.starCount || 0} />
          <ShareButton
            shotId={shot.id}
            title={shot.title}
            model={shot.model}
            harness={shot.harness}
            thumbnailUrl={shot.afterPreviewUrl ? `https://image.thum.io/get/width/800/${shot.afterPreviewUrl}` : undefined}
          />
        </div>
      </header>

      {/* Tech Stack Pills */}
      <div className="shot-tech-stack">
        <span className="shot-pill shot-pill-harness">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          {formatHarness(shot.harness)}
        </span>
        <span className="shot-pill shot-pill-model">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v6m0 6v10M4.22 4.22l4.24 4.24m7.08 7.08l4.24 4.24M1 12h6m6 0h10M4.22 19.78l4.24-4.24m7.08-7.08l4.24-4.24"/>
          </svg>
          {shot.model}
        </span>
        <span className="shot-pill shot-pill-type">{shot.type}</span>
        {shot.tags?.map((tag) => (
          <span key={tag} className="shot-pill shot-pill-tag">{tag}</span>
        ))}
      </div>

      {/* Stats Row */}
      <div className="shot-stats-row">
        <div className="shot-stat">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span className="shot-stat-value">{diffStats.filesChanged}</span>
          <span className="shot-stat-label">files</span>
        </div>
        <div className="shot-stat shot-stat-add">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span className="shot-stat-value">{diffStats.additions}</span>
          <span className="shot-stat-label">added</span>
        </div>
        <div className="shot-stat shot-stat-remove">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          <span className="shot-stat-value">{diffStats.deletions}</span>
          <span className="shot-stat-label">removed</span>
        </div>
        {generationTime && (
          <div className="shot-stat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            <span className="shot-stat-value">{formatDuration(generationTime)}</span>
            <span className="shot-stat-label">time</span>
          </div>
        )}
      </div>

      {/* Quick Links Card */}
      <div className="shot-links-card">
        <div className="shot-links-grid">
          <a
            href={shot.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shot-link-item"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span className="shot-link-text">{shot.repoUrl.replace('https://github.com/', '')}</span>
            <span className="shot-link-arrow">↗</span>
          </a>
          <a
            href={`${shot.repoUrl}/compare/${shot.beforeCommitHash}...${shot.afterCommitHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shot-link-item shot-link-diff"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 3h5v5M8 3H3v5M3 16v5h5M21 16v5h-5M21 3l-9 9M3 21l9-9"/>
            </svg>
            <span className="shot-link-text">View diff</span>
            <div className="shot-commit-hashes">
              <code>{shot.beforeCommitHash.slice(0, 7)}</code>
              <span>→</span>
              <code>{shot.afterCommitHash.slice(0, 7)}</code>
            </div>
            <span className="shot-link-arrow">↗</span>
          </a>
          {(shot.beforePreviewUrl || shot.afterPreviewUrl) && (
            <div className="shot-link-item shot-link-preview">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <span className="shot-link-text">Live preview</span>
              <div className="shot-preview-links">
                {shot.beforePreviewUrl && (
                  <a href={shot.beforePreviewUrl} target="_blank" rel="noopener noreferrer">Before ↗</a>
                )}
                {shot.afterPreviewUrl && (
                  <a href={shot.afterPreviewUrl} target="_blank" rel="noopener noreferrer">After ↗</a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recipe Panel */}
      <RecipePanel
        prompt={shot.prompt}
        model={shot.model}
        harness={shot.harness}
        sessionData={shot.sessionData}
      />

      {/* Comments */}
      <Comments shotId={shot.id} />

      {/* Mobile Sticky Actions */}
      <div className="shot-mobile-actions">
        <UpvoteButton shotId={shot.id} initialCount={shot.starCount || 0} />
        <ShareButton
          shotId={shot.id}
          title={shot.title}
          model={shot.model}
          harness={shot.harness}
          thumbnailUrl={shot.afterPreviewUrl ? `https://image.thum.io/get/width/800/${shot.afterPreviewUrl}` : undefined}
        />
      </div>
    </article>
  )
}
