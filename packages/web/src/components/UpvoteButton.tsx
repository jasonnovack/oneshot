'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface UpvoteButtonProps {
  shotId: string
  initialCount: number
  size?: 'small' | 'default'
}

export function UpvoteButton({ shotId, initialCount, size = 'default' }: UpvoteButtonProps) {
  const { data: session } = useSession()
  const [upvoted, setUpvoted] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetch(`/api/shots/${shotId}/star`)
        .then(res => res.json())
        .then(data => setUpvoted(data.starred))
        .catch(console.error)
    }
  }, [shotId, session])

  const toggleUpvote = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!session?.user) {
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/shots/${shotId}/star`, {
        method: 'POST',
      })
      const data = await res.json()

      if (res.ok) {
        setUpvoted(data.starred)
        setCount(prev => data.starred ? prev + 1 : prev - 1)
      }
    } catch (error) {
      console.error('Error toggling upvote:', error)
    } finally {
      setLoading(false)
    }
  }

  const sizeClass = size === 'small' ? 'upvote-button-sm' : ''
  const iconSize = size === 'small' ? 16 : 20

  return (
    <button
      onClick={toggleUpvote}
      disabled={loading || !session?.user}
      className={`upvote-button ${sizeClass} ${upvoted ? 'upvoted' : ''}`}
      title={session?.user ? (upvoted ? 'Remove upvote' : 'Upvote') : 'Sign in to upvote'}
    >
      <svg
        className="upvote-arrow"
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="18 15 12 9 6 15" />
      </svg>
      <span className="upvote-count">{count}</span>
    </button>
  )
}
