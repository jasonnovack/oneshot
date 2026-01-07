import { db } from '@/db'
import { shots, users } from '@/db/schema'
import { isNull, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

// One-time fix to associate all existing shots with a user
export async function POST(request: NextRequest) {
  // Auth check - require Bearer token and X-User-Id matching jasonnovack
  const authHeader = request.headers.get('Authorization')
  const userId = request.headers.get('X-User-Id')

  if (!authHeader?.startsWith('Bearer ') || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify user exists and is jasonnovack
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user || user.username !== 'jasonnovack') {
    return NextResponse.json({ error: 'Forbidden - admin only' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const targetUserId = body.userId

    if (!targetUserId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    // Update all shots with null userId
    const result = await db
      .update(shots)
      .set({ userId: targetUserId })
      .where(isNull(shots.userId))
      .returning({ id: shots.id })

    return NextResponse.json({
      success: true,
      updated: result.length,
      shotIds: result.map(r => r.id),
    })
  } catch (error) {
    console.error('Error fixing shots:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
