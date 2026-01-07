import { db } from '@/db'
import { shots } from '@/db/schema'
import { sql } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const [shot] = await db
    .select({
      id: shots.id,
      title: shots.title,
      beforePreviewUrl: shots.beforePreviewUrl,
      afterPreviewUrl: shots.afterPreviewUrl,
      beforeCommitHash: shots.beforeCommitHash,
      afterCommitHash: shots.afterCommitHash,
    })
    .from(shots)
    .where(sql`${shots.id} = ${id}::uuid`)
    .limit(1)

  if (!shot) {
    return NextResponse.json({ error: 'Shot not found' })
  }

  return NextResponse.json(shot)
}
