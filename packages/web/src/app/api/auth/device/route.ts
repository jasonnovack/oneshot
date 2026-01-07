import { db } from '@/db'
import { deviceCodes, users } from '@/db/schema'
import { eq, and, gt } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Generate random codes
function generateDeviceCode(): string {
  return crypto.randomBytes(32).toString('hex')
}

function generateUserCode(): string {
  // Short, easy to type code like "ABCD-1234"
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Avoid ambiguous chars
  let code = ''
  for (let i = 0; i < 8; i++) {
    if (i === 4) code += '-'
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// POST /api/auth/device - Create a new device code
export async function POST(request: NextRequest) {
  try {
    const deviceCode = generateDeviceCode()
    const userCode = generateUserCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    await db.insert(deviceCodes).values({
      deviceCode,
      userCode,
      expiresAt,
    })

    // Derive base URL from request or env
    const host = request.headers.get('host') || request.nextUrl.host
    const protocol = host?.includes('localhost') ? 'http' : 'https'
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      || (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`)
      || `${protocol}://${host}`

    return NextResponse.json({
      device_code: deviceCode,
      user_code: userCode,
      verification_uri: `${baseUrl}/auth/device`,
      expires_in: 900, // 15 minutes in seconds
      interval: 5, // Poll every 5 seconds
    })
  } catch (error) {
    console.error('Error creating device code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/auth/device?device_code=XXX - Poll for authorization
export async function GET(request: NextRequest) {
  try {
    const deviceCode = request.nextUrl.searchParams.get('device_code')

    if (!deviceCode) {
      return NextResponse.json({ error: 'device_code required' }, { status: 400 })
    }

    const [record] = await db
      .select()
      .from(deviceCodes)
      .where(eq(deviceCodes.deviceCode, deviceCode))
      .limit(1)

    if (!record) {
      return NextResponse.json({ error: 'invalid_device_code' }, { status: 400 })
    }

    if (new Date() > record.expiresAt) {
      // Clean up expired code
      await db.delete(deviceCodes).where(eq(deviceCodes.id, record.id))
      return NextResponse.json({ error: 'expired_token' }, { status: 400 })
    }

    if (!record.userId) {
      // Not yet authorized
      return NextResponse.json({ error: 'authorization_pending' }, { status: 428 })
    }

    // Authorized! Get user info and return token
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, record.userId))
      .limit(1)

    if (!user) {
      return NextResponse.json({ error: 'user_not_found' }, { status: 400 })
    }

    // Clean up used code
    await db.delete(deviceCodes).where(eq(deviceCodes.id, record.id))

    // Generate a simple API token (in production, use JWT or similar)
    const apiToken = crypto.randomBytes(32).toString('hex')

    // For now, we'll return user info directly
    // In production, you'd store this token and validate it on API calls
    return NextResponse.json({
      access_token: apiToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
      },
    })
  } catch (error) {
    console.error('Error polling device code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
