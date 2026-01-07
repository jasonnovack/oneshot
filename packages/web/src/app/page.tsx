import { db } from '@/db'
import { shots, users } from '@/db/schema'
import { desc, eq, ilike, or, and, inArray } from 'drizzle-orm'
import Link from 'next/link'
import { unstable_noStore as noStore } from 'next/cache'
import { GalleryFilters } from '@/components/GalleryFilters'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Props {
  searchParams: {
    q?: string
    harness?: string
    model?: string
    type?: string
    sort?: string
    help?: string
  }
}

function formatDiffPreview(diff: string): string {
  const lines = diff.split('\n').slice(0, 8)
  return lines.join('\n') + (diff.split('\n').length > 8 ? '\n...' : '')
}

export default async function GalleryPage({ searchParams }: Props) {
  noStore() // Disable all caching for this page

  const { q, harness, model, type, sort = 'newest' } = searchParams

  // Determine sort order
  const getOrderBy = () => {
    switch (sort) {
      case 'stars':
        return desc(shots.starCount)
      case 'comments':
        return desc(shots.commentCount)
      case 'newest':
      default:
        return desc(shots.createdAt)
    }
  }

  // Build filter conditions
  const conditions = []

  if (q) {
    conditions.push(
      or(
        ilike(shots.title, `%${q}%`),
        ilike(shots.prompt, `%${q}%`)
      )
    )
  }

  if (harness) {
    conditions.push(eq(shots.harness, harness))
  }

  if (model) {
    conditions.push(ilike(shots.model, `%${model}%`))
  }

  if (type) {
    conditions.push(eq(shots.type, type))
  }

  // Query shots with filters and sorting
  const baseQuery = db
    .select()
    .from(shots)
    .orderBy(getOrderBy())
    .limit(50)

  const shotsResult = conditions.length > 0
    ? await baseQuery.where(and(...conditions))
    : await baseQuery

  // Then fetch users for those shots
  const userIds = shotsResult.map(s => s.userId).filter(Boolean) as string[]
  const usersResult = userIds.length > 0
    ? await db.select().from(users).where(inArray(users.id, userIds))
    : []

  const usersMap = new Map(usersResult.map(u => [u.id, u]))

  // Combine into expected format
  const allShots = shotsResult.map(shot => ({
    shot,
    user: shot.userId ? usersMap.get(shot.userId) || null : null,
  }))

  // Get distinct values for filter dropdowns
  const harnessOptions = await db
    .selectDistinct({ harness: shots.harness })
    .from(shots)

  const typeOptions = ['feature', 'fix', 'refactor', 'ui', 'test', 'docs', 'other']

  const showGettingStarted = allShots.length === 0 || searchParams.help === 'true'

  return (
    <div>
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <h1>Welcome to Oneshot</h1>
        <p>
          The place to showcase and discover verified AI code transformations.
          One prompt, one commit, fully reproducible.
        </p>
      </div>

      {/* Getting Started - Always visible */}
      <div className="getting-started">
        <h2>How to Submit a Shot</h2>
        <ol>
          <li>Use an AI coding tool (Claude Code, Cursor, or Codex) to make a code change</li>
          <li>Commit your changes: <code>git add . && git commit -m "Your change"</code></li>
          <li>Install the CLI: <code>npm install -g @oneshot/cli</code></li>
          <li>Submit: <code>oneshot submit --title "Your title" --type feature</code></li>
        </ol>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: '1rem' }}>
          The CLI auto-detects your AI session and extracts the prompt, model, and settings.
          <br />
          Types: <code>feature</code> | <code>fix</code> | <code>refactor</code> | <code>ui</code> | <code>test</code> | <code>docs</code> | <code>other</code>
        </p>
      </div>

      <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Gallery</h2>

      {/* Filters */}
      <GalleryFilters
        harnessOptions={harnessOptions.map(h => h.harness)}
        typeOptions={typeOptions}
      />

      {allShots.length === 0 ? (
        <p style={{ color: 'var(--muted)', marginTop: '2rem' }}>
          {q || harness || model || type
            ? 'No shots match your filters.'
            : 'No shots yet. Submit your first shot with the CLI: oneshot submit'}
        </p>
      ) : (
        <div className="shots-grid">
          {allShots.map(({ shot, user }) => (
            <div key={shot.id} className="shot-card">
              <Link href={`/shots/${shot.id}`}>
                <h2>{shot.title}</h2>
                <div className="shot-meta">
                  {user ? (
                    <Link href={`/u/${user.username}`} className="author-link" onClick={(e) => e.stopPropagation()}>
                      @{user.username}
                    </Link>
                  ) : (
                    <span className="anonymous-author">Anonymous</span>
                  )}
                  <span className="shot-date">
                    {new Date(shot.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: shot.createdAt.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
                    })}
                  </span>
                  <span className="badge">{shot.harness}</span>
                  <span className="badge">{shot.model}</span>
                  <span className="badge">{shot.type}</span>
                  <span className="stats">
                    <span title="Stars">★ {shot.starCount || 0}</span>
                    <span title="Comments">💬 {shot.commentCount || 0}</span>
                  </span>
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
