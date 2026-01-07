import { db } from '@/db'
import { deviceCodes } from '@/db/schema'
import { eq, and, gt } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/auth/device/authorize - Authorize a device code
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const userCode = body.user_code?.toUpperCase()

    if (!userCode) {
      return NextResponse.json({ error: 'user_code required' }, { status: 400 })
    }

    // Find the device code record
    const [record] = await db
      .select()
      .from(deviceCodes)
      .where(
        and(
          eq(deviceCodes.userCode, userCode),
          gt(deviceCodes.expiresAt, new Date())
        )
      )
      .limit(1)

    if (!record) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 })
    }

    if (record.userId) {
      return NextResponse.json({ error: 'Code already used' }, { status: 400 })
    }

    // Link the device code to the user
    await db
      .update(deviceCodes)
      .set({ userId: session.user.id })
      .where(eq(deviceCodes.id, record.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error authorizing device:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
