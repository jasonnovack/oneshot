import { db } from '@/db'
import { requests, requestComments, users } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/requests/[id]/comments - List comments
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const results = await db
      .select({
        comment: requestComments,
        user: {
          id: users.id,
          username: users.username,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(requestComments)
      .leftJoin(users, eq(requestComments.userId, users.id))
      .where(eq(requestComments.requestId, id))
      .orderBy(desc(requestComments.createdAt))

    return NextResponse.json({ comments: results })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/requests/[id]/comments - Add comment
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - please sign in' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.content?.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    if (body.content.length > 2000) {
      return NextResponse.json({ error: 'Comment must be 2000 characters or less' }, { status: 400 })
    }

    // Check if request exists
    const [requestExists] = await db
      .select({ id: requests.id })
      .from(requests)
      .where(eq(requests.id, id))
      .limit(1)

    if (!requestExists) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Insert comment
    const [inserted] = await db
      .insert(requestComments)
      .values({
        requestId: id,
        userId: session.user.id,
        content: body.content.trim(),
      })
      .returning()

    // Increment comment count
    await db
      .update(requests)
      .set({ commentCount: sql`${requests.commentCount} + 1` })
      .where(eq(requests.id, id))

    // Fetch user data for response
    const [user] = await db
      .select({
        id: users.id,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    return NextResponse.json({
      comment: {
        comment: inserted,
        user,
      },
    })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
