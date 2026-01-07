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
    <div className="shot-detail">
      <div className="shot-header">
        <div>
          <h1>{shot.title}</h1>
          <div className="shot-meta">
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
            <span className="badge">{shot.harness}</span>
            <span className="badge">{shot.model}</span>
            <span className="badge">{shot.type}</span>
            {shot.tags?.map((tag) => (
              <span key={tag} className="badge">{tag}</span>
            ))}
          </div>
        </div>
        <StarButton shotId={shot.id} initialCount={shot.starCount || 0} />
      </div>

      <div className="shot-info">
        {/* Live Preview Links */}
        {(shot.beforePreviewUrl || shot.afterPreviewUrl) && (
          <div className="preview-links">
            <strong>Live Preview:</strong>{' '}
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
        )}
        <div className="commit-links">
          <strong>Commits:</strong>{' '}
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
        <div>
          <strong>Repo:</strong>{' '}
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
                    src={`https://s0.wordpress.com/mshots/v1/${encodeURIComponent(shot.beforePreviewUrl)}?w=800&v=${Math.floor(Date.now() / 86400000)}`}
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
                  src={`https://s0.wordpress.com/mshots/v1/${encodeURIComponent(shot.afterPreviewUrl)}?w=800&v=${Math.floor(Date.now() / 86400000)}`}
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
    </div>
  )
}
