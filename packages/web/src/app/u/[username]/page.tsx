import { db } from '@/db'
import { users, shots } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ username: string }>
}

function formatDiffPreview(diff: string): string {
  const lines = diff.split('\n').slice(0, 6)
  return lines.join('\n') + (diff.split('\n').length > 6 ? '\n...' : '')
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1)

  if (!user) {
    notFound()
  }

  const userShots = await db
    .select()
    .from(shots)
    .where(eq(shots.userId, user.id))
    .orderBy(desc(shots.createdAt))
    .limit(50)

  return (
    <div>
      <div className="user-header">
        {user.avatarUrl && (
          <img src={user.avatarUrl} alt={user.username} className="avatar" />
        )}
        <div>
          <h1>@{user.username}</h1>
          {user.name && <p style={{ color: 'var(--muted)' }}>{user.name}</p>}
          {user.bio && <p style={{ marginTop: '0.5rem' }}>{user.bio}</p>}
          <div className="user-links">
            <a href={`https://github.com/${user.username}`} target="_blank" rel="noopener noreferrer">
              GitHub ↗
            </a>
            {user.xUsername && (
              <a href={`https://x.com/${user.xUsername}`} target="_blank" rel="noopener noreferrer">
                @{user.xUsername} on X ↗
              </a>
            )}
          </div>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            {userShots.length} shot{userShots.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Shots</h2>

      {userShots.length === 0 ? (
        <p style={{ color: 'var(--muted)' }}>No shots yet.</p>
      ) : (
        <div className="shots-grid">
          {userShots.map((shot) => (
            <div key={shot.id} className="shot-card">
              <Link href={`/shots/${shot.id}`}>
                <h3>{shot.title}</h3>
                <div className="shot-meta">
                  <span className="badge">{shot.harness}</span>
                  <span className="badge">{shot.model}</span>
                  <span className="badge">{shot.type}</span>
                </div>
                <div className="diff-preview">
                  {formatDiffPreview(shot.diff).split('\n').map((line, i) => (
                    <div
                      key={i}
                      className={
                        line.startsWith('+') ? 'diff-add' :
                        line.startsWith('-') ? 'diff-remove' : ''
                      }
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
