import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Oneshot - Verified AI Code Transformations'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f0f10 0%, #1a1a1f 50%, #0f0f10 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
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

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
          }}
        >
          <svg width="80" height="80" viewBox="0 0 32 32">
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
            <circle cx="16" cy="16" r="1.5" fill="white" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: '72px',
            fontWeight: 800,
            background: 'linear-gradient(90deg, #fff 0%, #a5b4fc 100%)',
            backgroundClip: 'text',
            color: 'transparent',
            marginBottom: '20px',
            display: 'flex',
          }}
        >
          Oneshot
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '32px',
            color: '#a1a1aa',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: 1.4,
            display: 'flex',
          }}
        >
          Verified AI Code Transformations
        </div>

        {/* Features */}
        <div
          style={{
            display: 'flex',
            gap: '40px',
            marginTop: '50px',
          }}
        >
          {['Real Prompts', 'Actual Diffs', 'Reproducible'].map((text) => (
            <div
              key={text}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: '#71717a',
                fontSize: '24px',
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#6366f1',
                  display: 'flex',
                }}
              />
              {text}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
