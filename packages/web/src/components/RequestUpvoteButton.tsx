'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface RequestUpvoteButtonProps {
  requestId: string
  initialCount: number
  size?: 'small' | 'default'
}

export function RequestUpvoteButton({ requestId, initialCount, size = 'default' }: RequestUpvoteButtonProps) {
  const { data: session } = useSession()
  const [upvoted, setUpvoted] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  // Check if user has upvoted on mount
  useEffect(() => {
    if (session?.user?.id) {
      fetch(`/api/requests/${requestId}/upvote`)
        .then(res => res.json())
        .then(data => setUpvoted(data.upvoted))
        .catch(console.error)
    }
  }, [requestId, session?.user?.id])

  const handleUpvote = async () => {
    if (!session?.user?.id || loading) return

    setLoading(true)

    // Optimistic update
    const wasUpvoted = upvoted
    setUpvoted(!upvoted)
    setCount(prev => upvoted ? prev - 1 : prev + 1)

    try {
      const res = await fetch(`/api/requests/${requestId}/upvote`, {
        method: 'POST',
      })

      if (!res.ok) {
        // Revert on error
        setUpvoted(wasUpvoted)
        setCount(prev => wasUpvoted ? prev + 1 : prev - 1)
      }
    } catch (error) {
      // Revert on error
      setUpvoted(wasUpvoted)
      setCount(prev => wasUpvoted ? prev + 1 : prev - 1)
      console.error('Error toggling upvote:', error)
    } finally {
      setLoading(false)
    }
  }

  const isDisabled = !session?.user?.id || loading

  return (
    <button
      onClick={handleUpvote}
      disabled={isDisabled}
      className={`request-upvote-btn ${upvoted ? 'upvoted' : ''} ${size === 'small' ? 'request-upvote-btn-small' : ''}`}
      title={session?.user?.id ? (upvoted ? 'Remove upvote' : 'Upvote this request') : 'Sign in to upvote'}
    >
      <svg
        width={size === 'small' ? '16' : '20'}
        height={size === 'small' ? '16' : '20'}
        viewBox="0 0 24 24"
        fill={upvoted ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
      <span className="request-upvote-count">{count}</span>
    </button>
  )
}
