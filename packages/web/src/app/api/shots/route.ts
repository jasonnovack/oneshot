import { db } from '@/db'
import { shots, users, type NewShot } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { unstable_noStore as noStore } from 'next/cache'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface AuthResult {
  authenticated: boolean
  userId?: string
}

// Authenticate request - supports API key and Bearer token
async function authenticate(request: NextRequest): Promise<AuthResult> {
  // Check for Bearer token (from CLI login)
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    // In a production app, you'd validate this token against a tokens table
    // For now, we just accept any bearer token (the token was generated during device auth)
    // This is simplified - in production, store and validate tokens properly
    return { authenticated: true, userId: undefined }
  }

  // Check for API key
  const apiKey = request.headers.get('x-api-key')
  const expectedKey = process.env.ONESHOT_API_KEY
  if (!expectedKey) {
    // Dev mode - allow all
    return { authenticated: true }
  }
  if (apiKey === expectedKey) {
    return { authenticated: true }
  }

  return { authenticated: false }
}

export async function POST(request: NextRequest) {
  const auth = await authenticate(request)
  if (!auth.authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()

    // Validate required fields
    const required = ['title', 'type', 'repoUrl', 'beforeCommitHash', 'afterCommitHash', 'diff', 'harness', 'model', 'prompt']
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    // Validate type
    const validTypes = ['feature', 'fix', 'refactor', 'ui', 'test', 'docs', 'other']
    if (!validTypes.includes(body.type)) {
      return NextResponse.json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` }, { status: 400 })
    }

    // Validate harness
    const validHarnesses = ['claude_code', 'cursor', 'codex']
    if (!validHarnesses.includes(body.harness)) {
      return NextResponse.json({ error: `Invalid harness. Must be one of: ${validHarnesses.join(', ')}` }, { status: 400 })
    }

    // Hash session data for immutability proof
    const sessionHash = body.sessionData
      ? crypto.createHash('sha256').update(JSON.stringify(body.sessionData)).digest('hex')
      : null

    const newShot: NewShot = {
      userId: auth.userId || null,
      title: body.title,
      type: body.type,
      tags: body.tags || [],
      repoUrl: body.repoUrl,
      beforeCommitHash: body.beforeCommitHash,
      afterCommitHash: body.afterCommitHash,
      diff: body.diff,
      harness: body.harness,
      model: body.model,
      prompt: body.prompt,
      sessionData: body.sessionData ? JSON.stringify(body.sessionData) : null,
      sessionHash,
    }

    const [inserted] = await db.insert(shots).values(newShot).returning()

    // Derive base URL from request or env
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL
      || process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`
      || request.headers.get('origin')
      || 'http://localhost:3000'

    return NextResponse.json({
      success: true,
      shot: {
        id: inserted.id,
        url: `${baseUrl}/shots/${inserted.id}`,
      },
    })
  } catch (error) {
    console.error('Error creating shot:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  noStore()
  try {
    const allShots = await db.select().from(shots).limit(100)
    return NextResponse.json({ shots: allShots })
  } catch (error) {
    console.error('Error fetching shots:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
