import { db } from '@/db'
import { shots, users } from '@/db/schema'
import { isNull, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

// Compute diff stats from raw diff text
function computeDiffStats(diff: string) {
  const lines = diff.split('\n')
  let filesChanged = 0
  let additions = 0
  let deletions = 0

  for (const line of lines) {
    if (line.startsWith('diff --git')) {
      filesChanged++
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      additions++
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      deletions++
    }
  }

  return { filesChanged, additions, deletions }
}

// Backfill diff stats for all existing shots
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
    // Get all shots that need diff stats backfilled
    const shotsToUpdate = await db
      .select({
        id: shots.id,
        diff: shots.diff,
      })
      .from(shots)
      .where(isNull(shots.diffFilesChanged))

    let updated = 0
    const results = []

    for (const shot of shotsToUpdate) {
      const stats = computeDiffStats(shot.diff)

      await db
        .update(shots)
        .set({
          diffFilesChanged: stats.filesChanged,
          diffAdditions: stats.additions,
          diffDeletions: stats.deletions,
        })
        .where(eq(shots.id, shot.id))

      updated++
      results.push({
        id: shot.id,
        stats,
      })
    }

    return NextResponse.json({
      success: true,
      updated,
      results,
    })
  } catch (error) {
    console.error('Error backfilling diff stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
