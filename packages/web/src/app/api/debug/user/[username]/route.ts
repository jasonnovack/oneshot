import { db } from '@/db'
import { users, shots } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .limit(1)

  if (!user) {
    return NextResponse.json({ error: 'User not found', username })
  }

  // Debug: get all shots to see their userIds
  const allShots = await db
    .select({ id: shots.id, userId: shots.userId, title: shots.title })
    .from(shots)
    .limit(10)

  // Debug: try raw SQL query
  const rawResult = await db.execute(sql`
    SELECT id, user_id, title FROM shots WHERE user_id = ${user.id}::uuid LIMIT 10
  `)

  const userShots = await db
    .select()
    .from(shots)
    .where(eq(shots.userId, user.id))
    .orderBy(desc(shots.createdAt))
    .limit(50)

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
    },
    shotsCount: userShots.length,
    shots: userShots.map(s => ({ id: s.id, title: s.title, userId: s.userId })),
    debug: {
      allShotsUserIds: allShots.map(s => ({ id: s.id, userId: s.userId })),
      rawQueryResult: rawResult.rows,
    },
  })
}
