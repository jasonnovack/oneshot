import { db } from '@/db'
import { shots, users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { StarButton } from '@/components/StarButton'
import { Comments } from '@/components/Comments'
import { RecipePanel } from '@/components/RecipePanel'

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

  return (
    <article className="shot-detail">
      <header className="shot-header">
        <div className="shot-header-content">
          <h1>{shot.title}</h1>
          <div className="shot-meta-detail">
            {user ? (
              <>
                <Link href={`/u/${user.username}`} className="author-link author-with-avatar">
                  {user.avatarUrl && (
                    <img src={user.avatarUrl} alt={user.username} className="author-avatar" />
                  )}
                  @{user.username}
                </Link>
                <a
                  href={`https://github.com/${user.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link"
                  title="GitHub"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '4px', verticalAlign: '-2px' }}>
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  GitHub
                </a>
                {user.xUsername && (
                  <a
                    href={`https://x.com/${user.xUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-link"
                    title="X/Twitter"
                  >
                    @{user.xUsername}
                  </a>
                )}
              </>
            ) : (
              <span className="anonymous-author">Anonymous</span>
            )}
            <span className="shot-date">
              {new Date(shot.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>
          <div className="shot-meta-detail" style={{ marginTop: '12px' }}>
            <span className="badge badge-accent">{shot.harness}</span>
            <span className="badge">{shot.model}</span>
            <span className="badge">{shot.type}</span>
            {shot.tags?.map((tag) => (
              <span key={tag} className="badge">{tag}</span>
            ))}
          </div>
        </div>
        <StarButton shotId={shot.id} initialCount={shot.starCount || 0} />
      </header>

      <div className="shot-info">
        {/* Live Preview Links */}
        {(shot.beforePreviewUrl || shot.afterPreviewUrl) && (
          <div className="shot-info-row">
            <span className="shot-info-label">Live Preview</span>
            <div className="preview-links">
              {shot.beforePreviewUrl && (
                <a
                  href={shot.beforePreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="preview-link"
                >
                  Before ↗
                </a>
              )}
              {shot.beforePreviewUrl && shot.afterPreviewUrl && (
                <span className="separator">→</span>
              )}
              {shot.afterPreviewUrl && (
                <a
                  href={shot.afterPreviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="preview-link"
                >
                  After ↗
                </a>
              )}
            </div>
          </div>
        )}
        <div className="shot-info-row">
          <span className="shot-info-label">Commits</span>
          <div className="commit-links">
            <a
              href={`${shot.repoUrl}/tree/${shot.beforeCommitHash}`}
              target="_blank"
              rel="noopener noreferrer"
              title="View code at this commit"
            >
              <code>{shot.beforeCommitHash.slice(0, 7)}</code>
            </a>
            <span className="separator">→</span>
            <a
              href={`${shot.repoUrl}/tree/${shot.afterCommitHash}`}
              target="_blank"
              rel="noopener noreferrer"
              title="View code at this commit"
            >
              <code>{shot.afterCommitHash.slice(0, 7)}</code>
            </a>
            <span className="separator">|</span>
            <a
              href={`${shot.repoUrl}/compare/${shot.beforeCommitHash}...${shot.afterCommitHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="github-diff-link"
            >
              View diff on GitHub ↗
            </a>
          </div>
        </div>
        <div className="shot-info-row">
          <span className="shot-info-label">Repository</span>
          <a href={shot.repoUrl} target="_blank" rel="noopener noreferrer">
            {shot.repoUrl.replace('https://github.com/', '')}
          </a>
        </div>
      </div>

      {/* Screenshot Preview */}
      {shot.afterPreviewUrl && (
        <div className="screenshot-preview">
          <h3>Preview</h3>
          <div className="screenshot-container">
            {shot.beforePreviewUrl && (
              <div className="screenshot-item">
                <span className="screenshot-label">Before</span>
                <a href={shot.beforePreviewUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={`https://image.thum.io/get/width/800/${shot.beforePreviewUrl}`}
                    alt="Before preview"
                    className="screenshot-image"
                    loading="lazy"
                  />
                </a>
              </div>
            )}
            <div className="screenshot-item">
              <span className="screenshot-label">{shot.beforePreviewUrl ? 'After' : 'Live Preview'}</span>
              <a href={shot.afterPreviewUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={`https://image.thum.io/get/width/800/${shot.afterPreviewUrl}`}
                  alt="After preview"
                  className="screenshot-image"
                  loading="lazy"
                />
              </a>
            </div>
          </div>
        </div>
      )}

      <h3 style={{ marginTop: '2rem' }}>Diff</h3>
      <div className="full-diff">
        {shot.diff.split('\n').map((line, i) => (
          <div
            key={i}
            className={
              line.startsWith('+') && !line.startsWith('+++') ? 'diff-add' :
              line.startsWith('-') && !line.startsWith('---') ? 'diff-remove' : ''
            }
          >
            {line}
          </div>
        ))}
      </div>

      <RecipePanel
        prompt={shot.prompt}
        model={shot.model}
        harness={shot.harness}
        sessionData={shot.sessionData}
      />

      <Comments shotId={shot.id} />
    </article>
  )
}
