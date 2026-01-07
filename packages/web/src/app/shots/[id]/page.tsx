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
  params: { id: string }
}

export default async function ShotDetailPage({ params }: Props) {
  const [result] = await db
    .select({
      shot: shots,
      user: users,
    })
    .from(shots)
    .leftJoin(users, eq(shots.userId, users.id))
    .where(eq(shots.id, params.id))
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
            {user && (
              <>
                <Link href={`/u/${user.username}`} className="author-link">
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
            )}
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
        <div className="commit-links">
          <strong>Before:</strong>{' '}
          <a
            href={`${shot.repoUrl}/tree/${shot.beforeCommitHash}`}
            target="_blank"
            rel="noopener noreferrer"
            title="View code at this commit"
          >
            <code>{shot.beforeCommitHash.slice(0, 7)}</code>
          </a>
          <span className="separator">→</span>
          <strong>After:</strong>{' '}
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
            View on GitHub ↗
          </a>
        </div>
        <div>
          <strong>Repo:</strong>{' '}
          <a href={shot.repoUrl} target="_blank" rel="noopener noreferrer">
            {shot.repoUrl.replace('https://github.com/', '')}
          </a>
        </div>
      </div>

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
