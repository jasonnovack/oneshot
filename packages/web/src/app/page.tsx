import { db } from '@/db'
import { shots, users } from '@/db/schema'
import { desc, eq, ilike, or, and, sql } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: {
    q?: string
    harness?: string
    model?: string
    type?: string
    sort?: string
  }
}

function formatDiffPreview(diff: string): string {
  const lines = diff.split('\n').slice(0, 8)
  return lines.join('\n') + (diff.split('\n').length > 8 ? '\n...' : '')
}

export default async function GalleryPage({ searchParams }: Props) {
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

  // Query with filters
  const allShots = await db
    .select({
      shot: shots,
      user: users,
    })
    .from(shots)
    .leftJoin(users, eq(shots.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(getOrderBy())
    .limit(50)

  // Get distinct values for filter dropdowns
  const harnessOptions = await db
    .selectDistinct({ harness: shots.harness })
    .from(shots)

  const typeOptions = ['feature', 'fix', 'refactor', 'ui', 'test', 'docs', 'other']

  return (
    <div>
      <h1>Gallery</h1>
      <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
        Verified AI code transformations. One prompt, one commit.
      </p>

      {/* Filters */}
      <form className="filters" method="GET">
        <input
          type="text"
          name="q"
          placeholder="Search shots..."
          defaultValue={q || ''}
          className="search-input"
        />
        <select name="harness" defaultValue={harness || ''} className="filter-select">
          <option value="">All harnesses</option>
          {harnessOptions.map((h) => (
            <option key={h.harness} value={h.harness}>{h.harness}</option>
          ))}
        </select>
        <select name="type" defaultValue={type || ''} className="filter-select">
          <option value="">All types</option>
          {typeOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <input
          type="text"
          name="model"
          placeholder="Model..."
          defaultValue={model || ''}
          className="search-input"
          style={{ width: '150px' }}
        />
        <select name="sort" defaultValue={sort} className="filter-select">
          <option value="newest">Newest</option>
          <option value="stars">Most Starred</option>
          <option value="comments">Most Discussed</option>
        </select>
        <button type="submit" className="filter-btn">Filter</button>
        {(q || harness || model || type) && (
          <Link href="/" className="clear-btn">Clear</Link>
        )}
      </form>

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
                  {user && (
                    <Link href={`/u/${user.username}`} className="author-link" onClick={(e) => e.stopPropagation()}>
                      @{user.username}
                    </Link>
                  )}
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
