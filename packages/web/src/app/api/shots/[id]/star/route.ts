import { db } from '@/db'
import { stars, shots } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: { id: string }
}

// GET /api/shots/[id]/star - Check if current user has starred
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ starred: false })
    }

    const [star] = await db
      .select()
      .from(stars)
      .where(and(
        eq(stars.shotId, params.id),
        eq(stars.userId, session.user.id)
      ))
      .limit(1)

    return NextResponse.json({ starred: !!star })
  } catch (error) {
    console.error('Error checking star:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/shots/[id]/star - Toggle star (add if not exists, remove if exists)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Check if already starred
    const [existingStar] = await db
      .select()
      .from(stars)
      .where(and(
        eq(stars.shotId, params.id),
        eq(stars.userId, session.user.id)
      ))
      .limit(1)

    if (existingStar) {
      // Remove star
      await db
        .delete(stars)
        .where(and(
          eq(stars.shotId, params.id),
          eq(stars.userId, session.user.id)
        ))

      // Decrement star count
      await db
        .update(shots)
        .set({ starCount: sql`GREATEST(${shots.starCount} - 1, 0)` })
        .where(eq(shots.id, params.id))

      return NextResponse.json({ starred: false })
    } else {
      // Add star
      await db
        .insert(stars)
        .values({
          shotId: params.id,
          userId: session.user.id,
        })

      // Increment star count
      await db
        .update(shots)
        .set({ starCount: sql`${shots.starCount} + 1` })
        .where(eq(shots.id, params.id))

      return NextResponse.json({ starred: true })
    }
  } catch (error) {
    console.error('Error toggling star:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
