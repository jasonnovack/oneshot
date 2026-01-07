import { db } from '@/db'
import { users, shots } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'
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
  })
}
