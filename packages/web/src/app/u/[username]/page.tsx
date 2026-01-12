import { db } from '@/db'
import { users, shots, type Shot } from '@/db/schema'
import { desc, sql } from 'drizzle-orm'
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
    .where(sql`${users.username} = ${username}`)
    .limit(1)

  if (!user) {
    notFound()
  }

  // Use raw SQL to work around drizzle UUID comparison issue on Vercel
  const userShots = await db
    .select()
    .from(shots)
    .where(sql`${shots.userId} = ${user.id}::uuid`)
    .orderBy(desc(shots.createdAt))
    .limit(50)

  // Calculate total stars
  const totalStars = userShots.reduce((sum, shot) => sum + (shot.starCount || 0), 0)

  return (
    <div>
      <header className="user-header">
        {user.avatarUrl && (
          <img src={user.avatarUrl} alt={user.username} className="avatar" />
        )}
        <div className="user-info">
          <h1>@{user.username}</h1>
          {user.name && <p className="user-bio">{user.name}</p>}
          {user.bio && <p className="user-bio">{user.bio}</p>}
          <div className="user-links">
            <a href={`https://github.com/${user.username}`} target="_blank" rel="noopener noreferrer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
            {user.xUsername && (
              <a href={`https://x.com/${user.xUsername}`} target="_blank" rel="noopener noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                @{user.xUsername}
              </a>
            )}
          </div>
          <div className="user-stats">
            <div className="user-stat">
              <span className="user-stat-value">{userShots.length}</span>
              <span className="user-stat-label">Shots</span>
            </div>
            <div className="user-stat">
              <span className="user-stat-value">{totalStars}</span>
              <span className="user-stat-label">Stars</span>
            </div>
          </div>
        </div>
      </header>

      <h2 style={{ marginTop: '2rem', marginBottom: '1.5rem' }}>Shots</h2>

      {userShots.length === 0 ? (
        <div className="empty-state">
          <p>No shots yet.</p>
        </div>
      ) : (
        <div className="shots-grid">
          {userShots.map((shot) => (
            <article key={shot.id} className="shot-card">
              {/* Thumbnail - type-based placeholder */}
              <Link href={`/shots/${shot.id}`} className="shot-thumbnail-link">
                <div className={`shot-thumbnail-placeholder shot-type-${shot.type}`}>
                  {shot.type === 'feature' && (
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  )}
                  {shot.type === 'fix' && (
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                    </svg>
                  )}
                  {shot.type === 'refactor' && (
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <polyline points="16 18 22 12 16 6"/>
                      <polyline points="8 6 2 12 8 18"/>
                    </svg>
                  )}
                  {shot.type === 'ui' && (
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <line x1="3" y1="9" x2="21" y2="9"/>
                      <line x1="9" y1="21" x2="9" y2="9"/>
                    </svg>
                  )}
                  {shot.type === 'test' && (
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <polyline points="9 11 12 14 22 4"/>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                    </svg>
                  )}
                  {shot.type === 'docs' && (
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  )}
                  {shot.type === 'other' && (
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  )}
                </div>
              </Link>

              {/* Card Content */}
              <div className="shot-card-content">
                <Link href={`/shots/${shot.id}`}>
                  <h2>{shot.title}</h2>
                </Link>
                <div className="shot-meta">
                  <span className="shot-date">
                    {new Date(shot.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span className="badge">{shot.harness}</span>
                  <span className="badge">{shot.type}</span>
                  <span className="stats">
                    <span title="Stars">★ {shot.starCount || 0}</span>
                  </span>
                </div>
              </div>

              {/* Diff Preview */}
              <Link href={`/shots/${shot.id}`} className="diff-preview-link">
                <div className="diff-preview">
                  {formatDiffPreview(shot.diff).split('\n').map((line, i) => (
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
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
