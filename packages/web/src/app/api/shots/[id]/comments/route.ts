import { db } from '@/db'
import { comments, shots, users } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: { id: string }
}

// GET /api/shots/[id]/comments - List comments for a shot
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const shotComments = await db
      .select({
        comment: comments,
        user: {
          id: users.id,
          username: users.username,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.shotId, params.id))
      .orderBy(desc(comments.createdAt))

    return NextResponse.json({ comments: shotComments })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/shots/[id]/comments - Add a comment
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.content || typeof body.content !== 'string' || body.content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    if (body.content.length > 2000) {
      return NextResponse.json({ error: 'Comment too long (max 2000 characters)' }, { status: 400 })
    }

    // Verify shot exists
    const [shot] = await db
      .select({ id: shots.id })
      .from(shots)
      .where(eq(shots.id, params.id))
      .limit(1)

    if (!shot) {
      return NextResponse.json({ error: 'Shot not found' }, { status: 404 })
    }

    // Insert comment
    const [newComment] = await db
      .insert(comments)
      .values({
        shotId: params.id,
        userId: session.user.id,
        content: body.content.trim(),
      })
      .returning()

    // Update comment count on shot
    await db
      .update(shots)
      .set({ commentCount: sql`${shots.commentCount} + 1` })
      .where(eq(shots.id, params.id))

    // Fetch the comment with user info
    const [commentWithUser] = await db
      .select({
        comment: comments,
        user: {
          id: users.id,
          username: users.username,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(comments)
      .leftJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.id, newComment.id))

    return NextResponse.json({ comment: commentWithUser })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
