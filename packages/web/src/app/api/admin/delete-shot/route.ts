import { db } from '@/db'
import { shots, users, stars, comments } from '@/db/schema'
import { sql, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Admin endpoint to delete a shot
export async function POST(request: NextRequest) {
  // Auth check - require Bearer token and X-User-Id matching jasonnovack
  const authHeader = request.headers.get('Authorization')
  const userId = request.headers.get('X-User-Id')

  if (!authHeader?.startsWith('Bearer ') || !userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify user exists and is jasonnovack
  const [user] = await db.select().from(users).where(sql`${users.id} = ${userId}::uuid`).limit(1)
  if (!user || user.username !== 'jasonnovack') {
    return NextResponse.json({ error: 'Forbidden - admin only' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { shotId } = body

    if (!shotId) {
      return NextResponse.json({ error: 'shotId required' }, { status: 400 })
    }

    // Delete related records first (foreign key constraints)
    await db.delete(stars).where(sql`${stars.shotId} = ${shotId}::uuid`)
    await db.delete(comments).where(sql`${comments.shotId} = ${shotId}::uuid`)

    // Delete the shot
    const result = await db
      .delete(shots)
      .where(sql`${shots.id} = ${shotId}::uuid`)
      .returning({ id: shots.id })

    if (result.length === 0) {
      return NextResponse.json({ error: 'Shot not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      deleted: result[0].id,
    })
  } catch (error) {
    console.error('Error deleting shot:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
