'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import Link from 'next/link'

export function Header() {
  const { data: session, status } = useSession()

  return (
    <header className="header">
      <Link href="/" className="logo">Oneshot</Link>
      <nav>
        <Link href="/">Gallery</Link>
        <a href="https://github.com/jasonnovack/oneshot" target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        {status === 'loading' ? (
          <span style={{ marginLeft: '2rem', color: 'var(--muted)' }}>...</span>
        ) : session ? (
          <>
            <Link href={`/u/${session.user.username}`}>
              {session.user.username}
            </Link>
            <button onClick={() => signOut()} className="auth-btn">
              Sign out
            </button>
          </>
        ) : (
          <button onClick={() => signIn('github')} className="auth-btn">
            Sign in with GitHub
          </button>
        )}
      </nav>
    </header>
  )
}
