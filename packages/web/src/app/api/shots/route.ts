import { db } from '@/db'
import { shots, users, type NewShot } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { unstable_noStore as noStore } from 'next/cache'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

interface AuthResult {
  authenticated: boolean
  userId?: string
}

// Authenticate request - supports API key and Bearer token
async function authenticate(request: NextRequest): Promise<AuthResult> {
  // Check for Bearer token (from CLI login)
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    // Get user ID from header (sent by CLI)
    const userId = request.headers.get('X-User-Id')
    if (userId) {
      // Verify user exists
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
      if (user) {
        return { authenticated: true, userId: user.id }
      }
    }
    // Token valid but no user ID - still authenticated but anonymous
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

    // Pre-compute diff stats to avoid loading full diff on gallery pages
    const diffStats = computeDiffStats(body.diff)

    const newShot: NewShot = {
      userId: auth.userId || null,
      title: body.title,
      type: body.type,
      tags: body.tags || [],
      repoUrl: body.repoUrl,
      beforeCommitHash: body.beforeCommitHash,
      afterCommitHash: body.afterCommitHash,
      diff: body.diff,
      diffFilesChanged: diffStats.filesChanged,
      diffAdditions: diffStats.additions,
      diffDeletions: diffStats.deletions,
      beforePreviewUrl: body.beforePreviewUrl || null,
      afterPreviewUrl: body.afterPreviewUrl || null,
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
