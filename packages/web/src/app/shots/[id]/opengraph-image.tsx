import { ImageResponse } from 'next/og'
import { db } from '@/db'
import { shots, users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'edge'
export const alt = 'Oneshot'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Helper to compute diff stats
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

// Format harness name
function formatHarness(harness: string): string {
  const names: Record<string, string> = {
    claude_code: 'Claude Code',
    cursor: 'Cursor',
    codex: 'Codex CLI',
  }
  return names[harness] || harness
}

// Type colors
const typeColors: Record<string, string> = {
  feature: '#fbbf24',
  fix: '#ef4444',
  refactor: '#6366f1',
  ui: '#a855f7',
  test: '#22c55e',
  docs: '#3b82f6',
  other: '#71717a',
}

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [result] = await db
    .select({
      shot: shots,
      user: users,
    })
    .from(shots)
    .leftJoin(users, eq(shots.userId, users.id))
    .where(eq(shots.id, id))
    .limit(1)

  if (!result) {
    // Fallback to generic image
    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(135deg, #0f0f10 0%, #1a1a1f 100%)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '48px',
            color: 'white',
          }}
        >
          Shot not found
        </div>
      ),
      { ...size }
    )
  }

  const { shot, user } = result
  const diffStats = shot.diffFilesChanged !== null
    ? { filesChanged: shot.diffFilesChanged, additions: shot.diffAdditions || 0, deletions: shot.diffDeletions || 0 }
    : computeDiffStats(shot.diff)
  const typeColor = typeColors[shot.type] || typeColors.other

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f0f10 0%, #1a1a1f 50%, #0f0f10 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          padding: '60px',
        }}
      >
        {/* Background Pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
            display: 'flex',
          }}
        />

        {/* Main Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flex: 1,
            zIndex: 1,
          }}
        >
          {/* Top: Logo and Type Badge */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            {/* Logo */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <svg width="48" height="48" viewBox="0 0 32 32">
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#6366f1' }} />
                    <stop offset="100%" style={{ stopColor: '#8b5cf6' }} />
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="6" fill="url(#grad)" />
                <path d="M10 10L6 16L10 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M22 10L26 16L22 22" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <circle cx="16" cy="16" r="3" fill="#fbbf24" />
              </svg>
              <span style={{ fontSize: '28px', fontWeight: 700, color: '#a1a1aa' }}>
                Oneshot
              </span>
            </div>

            {/* Type Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 24px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '999px',
                border: `2px solid ${typeColor}`,
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: typeColor,
                  display: 'flex',
                }}
              />
              <span style={{ fontSize: '20px', fontWeight: 600, color: 'white', textTransform: 'capitalize' }}>
                {shot.type}
              </span>
            </div>
          </div>

          {/* Middle: Title */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div
              style={{
                fontSize: '56px',
                fontWeight: 800,
                color: 'white',
                lineHeight: 1.2,
                maxWidth: '900px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {shot.title}
            </div>

            {/* Stats Row */}
            <div
              style={{
                display: 'flex',
                gap: '32px',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '28px', fontWeight: 700, color: '#22c55e' }}>
                  +{diffStats.additions}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '28px', fontWeight: 700, color: '#ef4444' }}>
                  -{diffStats.deletions}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px', color: '#71717a' }}>
                  {diffStats.filesChanged} {diffStats.filesChanged === 1 ? 'file' : 'files'}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom: Author and Harness */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
            }}
          >
            {/* Author */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              {user?.avatarUrl && (
                <img
                  src={user.avatarUrl}
                  width={48}
                  height={48}
                  style={{ borderRadius: '50%' }}
                />
              )}
              <span style={{ fontSize: '24px', color: '#a1a1aa' }}>
                {user ? `@${user.username}` : 'Anonymous'}
              </span>
            </div>

            {/* Harness + Model */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
              }}
            >
              <div
                style={{
                  padding: '10px 20px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  borderRadius: '8px',
                  fontSize: '20px',
                  color: '#a5b4fc',
                  fontWeight: 500,
                  display: 'flex',
                }}
              >
                {formatHarness(shot.harness)}
              </div>
              <div
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  fontSize: '20px',
                  color: '#a1a1aa',
                  fontWeight: 500,
                  display: 'flex',
                }}
              >
                {shot.model}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
