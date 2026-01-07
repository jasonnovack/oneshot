'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'

export default function DeviceAuthPage() {
  const { data: session, status } = useSession()
  const searchParams = useSearchParams()
  const [userCode, setUserCode] = useState(searchParams.get('code') || '')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // Auto-submit if code is in URL and user is logged in
  useEffect(() => {
    const code = searchParams.get('code')
    if (code && session?.user) {
      setUserCode(code)
      authorizeDevice(code)
    }
  }, [searchParams, session])

  const authorizeDevice = async (code: string) => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/device/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_code: code }),
      })

      if (res.ok) {
        setSuccess(true)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to authorize device')
      }
    } catch (err) {
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (userCode.trim()) {
      authorizeDevice(userCode.trim().toUpperCase())
    }
  }

  if (status === 'loading') {
    return (
      <div className="device-auth">
        <h1>Device Authorization</h1>
        <p>Loading...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="device-auth">
        <h1>Device Authorization</h1>
        <p>Sign in to authorize the Oneshot CLI.</p>
        <button onClick={() => signIn('github')} className="auth-btn" style={{ marginTop: '1rem' }}>
          Sign in with GitHub
        </button>
      </div>
    )
  }

  if (success) {
    return (
      <div className="device-auth">
        <h1>Device Authorized!</h1>
        <p className="success-message">
          You can now close this window and return to the CLI.
        </p>
      </div>
    )
  }

  return (
    <div className="device-auth">
      <h1>Device Authorization</h1>
      <p>Enter the code shown in your terminal to authorize the Oneshot CLI.</p>

      <form onSubmit={handleSubmit} className="device-form">
        <input
          type="text"
          value={userCode}
          onChange={(e) => setUserCode(e.target.value.toUpperCase())}
          placeholder="XXXX-XXXX"
          maxLength={9}
          className="code-input"
          autoFocus
        />
        <button type="submit" disabled={loading || userCode.length < 9} className="filter-btn">
          {loading ? 'Authorizing...' : 'Authorize'}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}

      <p className="signed-in-as">
        Signed in as <strong>@{session.user.username}</strong>
      </p>
    </div>
  )
}
