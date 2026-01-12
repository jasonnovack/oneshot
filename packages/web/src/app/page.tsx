import { db } from '@/db'
import { shots, users } from '@/db/schema'
import { desc, eq, ilike, or, and, sql } from 'drizzle-orm'
import Link from 'next/link'
import { unstable_noStore as noStore } from 'next/cache'
import { GalleryFilters } from '@/components/GalleryFilters'
import { WelcomeBanner } from '@/components/WelcomeBanner'
import { ShotCard } from '@/components/ShotCard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Props {
  searchParams: {
    q?: string
    harness?: string
    type?: string
    sort?: string
  }
}

// Format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

// Format harness name
function formatHarness(harness: string): string {
  const names: Record<string, string> = {
    claude_code: 'Claude Code',
    cursor: 'Cursor',
    codex: 'Codex CLI',
  }
  return names[harness] || harness
}

export default async function GalleryPage({ searchParams }: Props) {
  noStore()

  const { q, harness, type, sort = 'newest' } = searchParams

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

  if (type) {
    conditions.push(eq(shots.type, type))
  }

  // Query shots with filters and sorting
  // IMPORTANT: Only select columns needed for gallery cards to minimize bandwidth
  // Excludes: diff, sessionData, prompt (large fields only needed on detail page)
  const baseQuery = db
    .select({
      id: shots.id,
      userId: shots.userId,
      title: shots.title,
      type: shots.type,
      harness: shots.harness,
      model: shots.model,
      afterPreviewUrl: shots.afterPreviewUrl,
      starCount: shots.starCount,
      commentCount: shots.commentCount,
      createdAt: shots.createdAt,
      // Pre-computed diff stats (avoids loading full diff)
      diffFilesChanged: shots.diffFilesChanged,
      diffAdditions: shots.diffAdditions,
      diffDeletions: shots.diffDeletions,
    })
    .from(shots)
    .orderBy(getOrderBy())
    .limit(50)

  const shotsResult = conditions.length > 0
    ? await baseQuery.where(and(...conditions))
    : await baseQuery

  // Fetch users for those shots
  const userIds = shotsResult.map(s => s.userId).filter(Boolean) as string[]
  const usersResult = userIds.length > 0
    ? await db.select().from(users).where(sql`${users.id} IN (${sql.join(userIds.map(id => sql`${id}::uuid`), sql`, `)})`)
    : []

  const usersMap = new Map(usersResult.map(u => [u.id, u]))

  // Combine into expected format
  const allShots = shotsResult.map(shot => ({
    shot,
    user: shot.userId ? usersMap.get(shot.userId) || null : null,
    diffStats: {
      filesChanged: shot.diffFilesChanged || 0,
      additions: shot.diffAdditions || 0,
      deletions: shot.diffDeletions || 0,
    },
    relativeTime: formatRelativeTime(new Date(shot.createdAt)),
    harnessDisplay: formatHarness(shot.harness),
  }))

  // Get distinct values for filter dropdowns
  const harnessOptions = await db
    .selectDistinct({ harness: shots.harness })
    .from(shots)

  const typeOptions = ['feature', 'fix', 'refactor', 'ui', 'test', 'docs', 'other']

  const hasFilters = q || harness || type

  return (
    <div className="gallery-page">
      <WelcomeBanner />

      {/* Gallery Header */}
      <header className="gallery-header">
        <div className="gallery-header-content">
          <h1 className="gallery-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            Gallery
          </h1>
          <p className="gallery-subtitle">{allShots.length} shots from the community</p>
        </div>
      </header>

      {/* Filters */}
      <GalleryFilters
        harnessOptions={harnessOptions.map(h => h.harness)}
        typeOptions={typeOptions}
        totalCount={allShots.length}
      />

      {/* Results */}
      {allShots.length === 0 ? (
        <div className="gallery-empty">
          <div className="gallery-empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <h3>
            {hasFilters ? 'No shots match your filters' : 'No shots yet'}
          </h3>
          <p>
            {hasFilters
              ? 'Try adjusting your search or filters to find what you\'re looking for.'
              : 'Be the first to share your AI-powered code transformation.'}
          </p>
          {!hasFilters && (
            <div className="gallery-empty-cta">
              <code>npm install -g @oneshot/cli && oneshot submit</code>
            </div>
          )}
          {hasFilters && (
            <Link href="/" className="gallery-empty-clear">
              Clear all filters
            </Link>
          )}
        </div>
      ) : (
        <div className="shots-list">
          {allShots.map(({ shot, user, diffStats, relativeTime, harnessDisplay }) => (
            <ShotCard
              key={shot.id}
              shot={shot}
              user={user}
              diffStats={diffStats}
              relativeTime={relativeTime}
              harnessDisplay={harnessDisplay}
            />
          ))}
        </div>
      )}
    </div>
  )
}
