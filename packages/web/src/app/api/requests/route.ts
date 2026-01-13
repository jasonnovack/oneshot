import { db } from '@/db'
import { requests, users, type NewRequest } from '@/db/schema'
import { desc, eq, and, ilike, or } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Valid request types
const validTypes = ['model', 'harness', 'hosting', 'plugin', 'other']
const validStatuses = ['open', 'planned', 'completed', 'declined']

// GET /api/requests - List all requests with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const sort = searchParams.get('sort') || 'upvotes'
    const q = searchParams.get('q')

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

    // Query with joins
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

    return NextResponse.json({ requests: results })
  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/requests - Create new request (auth required)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - please sign in' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!body.description?.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }

    if (!body.type || !validTypes.includes(body.type)) {
      return NextResponse.json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 })
    }

    // Validate lengths
    if (body.title.length > 100) {
      return NextResponse.json({ error: 'Title must be 100 characters or less' }, { status: 400 })
    }

    if (body.description.length > 2000) {
      return NextResponse.json({ error: 'Description must be 2000 characters or less' }, { status: 400 })
    }

    // Validate link if provided
    if (body.link) {
      try {
        new URL(body.link)
      } catch {
        return NextResponse.json({ error: 'Invalid URL format for link' }, { status: 400 })
      }
    }

    const newRequest: NewRequest = {
      userId: session.user.id,
      type: body.type,
      title: body.title.trim(),
      description: body.description.trim(),
      link: body.link?.trim() || null,
    }

    const [inserted] = await db.insert(requests).values(newRequest).returning()

    return NextResponse.json({
      success: true,
      request: inserted,
    })
  } catch (error) {
    console.error('Error creating request:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
