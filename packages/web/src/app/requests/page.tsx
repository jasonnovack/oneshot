import { db } from '@/db'
import { requests, users } from '@/db/schema'
import { desc, eq, and, ilike, or } from 'drizzle-orm'
import Link from 'next/link'
import { unstable_noStore as noStore } from 'next/cache'
import { RequestFilters } from '@/components/RequestFilters'
import { RequestCard } from '@/components/RequestCard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Feature Requests',
  description: 'Request new models, harnesses, hosting services, plugins, and more for Oneshot.',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Props {
  searchParams: Promise<{
    q?: string
    type?: string
    status?: string
    sort?: string
  }>
}

// Valid filters
const validTypes = ['model', 'harness', 'hosting', 'plugin', 'other']
const validStatuses = ['open', 'planned', 'completed', 'declined']

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

export default async function RequestsPage({ searchParams }: Props) {
  noStore()

  const { q, type, status, sort = 'upvotes' } = await searchParams

  // Build conditions
  const conditions = []

  if (type && validTypes.includes(type)) {
    conditions.push(eq(requests.type, type))
  }

  if (status && validStatuses.includes(status)) {
    conditions.push(eq(requests.status, status))
  }

  if (q) {
    conditions.push(
      or(
        ilike(requests.title, `%${q}%`),
        ilike(requests.description, `%${q}%`)
      )
    )
  }

  // Determine sort order
  const getOrderBy = () => {
    switch (sort) {
      case 'newest':
        return desc(requests.createdAt)
      case 'comments':
        return desc(requests.commentCount)
      case 'upvotes':
      default:
        return desc(requests.upvoteCount)
    }
  }

  // Query requests
  const baseQuery = db
    .select({
      request: requests,
      user: {
        id: users.id,
        username: users.username,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(requests)
    .leftJoin(users, eq(requests.userId, users.id))
    .orderBy(getOrderBy())
    .limit(100)

  const results = conditions.length > 0
    ? await baseQuery.where(and(...conditions))
    : await baseQuery

  // Format for display
  const allRequests = results.map(({ request, user }) => ({
    request,
    user,
    relativeTime: formatRelativeTime(new Date(request.createdAt)),
  }))

  const hasFilters = q || type || status

  return (
    <div className="requests-page">
      {/* Header */}
      <header className="requests-header">
        <div className="requests-header-content">
          <h1 className="requests-title">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Feature Requests
          </h1>
          <p className="requests-subtitle">
            Request new models, harnesses, hosting services, and more
          </p>
        </div>
        <Link href="/requests/new" className="requests-new-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Request
        </Link>
      </header>

      {/* Filters */}
      <RequestFilters totalCount={allRequests.length} />

      {/* Results */}
      {allRequests.length === 0 ? (
        <div className="requests-empty">
          <div className="requests-empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h3>
            {hasFilters ? 'No requests match your filters' : 'No requests yet'}
          </h3>
          <p>
            {hasFilters
              ? 'Try adjusting your search or filters.'
              : 'Be the first to request a feature!'}
          </p>
          {!hasFilters && (
            <Link href="/requests/new" className="requests-empty-cta">
              Submit a Request
            </Link>
          )}
          {hasFilters && (
            <Link href="/requests" className="requests-empty-clear">
              Clear all filters
            </Link>
          )}
        </div>
      ) : (
        <div className="requests-list">
          {allRequests.map(({ request, user, relativeTime }) => (
            <RequestCard
              key={request.id}
              request={request}
              user={user}
              relativeTime={relativeTime}
            />
          ))}
        </div>
      )}
    </div>
  )
}
