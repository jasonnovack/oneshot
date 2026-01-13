import { db } from '@/db'
import { requests, requestUpvotes } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/requests/[id]/upvote - Check if user upvoted
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ upvoted: false })
    }

    const [existing] = await db
      .select()
      .from(requestUpvotes)
      .where(
        and(
          eq(requestUpvotes.requestId, id),
          eq(requestUpvotes.userId, session.user.id)
        )
      )
      .limit(1)

    return NextResponse.json({ upvoted: !!existing })
  } catch (error) {
    console.error('Error checking upvote:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/requests/[id]/upvote - Toggle upvote
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized - please sign in' }, { status: 401 })
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

    // Check if already upvoted
    const [existing] = await db
      .select()
      .from(requestUpvotes)
      .where(
        and(
          eq(requestUpvotes.requestId, id),
          eq(requestUpvotes.userId, session.user.id)
        )
      )
      .limit(1)

    if (existing) {
      // Remove upvote
      await db
        .delete(requestUpvotes)
        .where(
          and(
            eq(requestUpvotes.requestId, id),
            eq(requestUpvotes.userId, session.user.id)
          )
        )

      // Decrement count (ensure non-negative)
      await db
        .update(requests)
        .set({ upvoteCount: sql`GREATEST(${requests.upvoteCount} - 1, 0)` })
        .where(eq(requests.id, id))

      return NextResponse.json({ upvoted: false })
    } else {
      // Add upvote
      await db.insert(requestUpvotes).values({
        requestId: id,
        userId: session.user.id,
      })

      // Increment count
      await db
        .update(requests)
        .set({ upvoteCount: sql`${requests.upvoteCount} + 1` })
        .where(eq(requests.id, id))

      return NextResponse.json({ upvoted: true })
    }
  } catch (error) {
    console.error('Error toggling upvote:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
