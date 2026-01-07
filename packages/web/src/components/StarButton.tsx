'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface StarButtonProps {
  shotId: string
  initialCount: number
}

export function StarButton({ shotId, initialCount }: StarButtonProps) {
  const { data: session } = useSession()
  const [starred, setStarred] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetch(`/api/shots/${shotId}/star`)
        .then(res => res.json())
        .then(data => setStarred(data.starred))
        .catch(console.error)
    }
  }, [shotId, session])

  const toggleStar = async () => {
    if (!session?.user) {
      // Could show a login prompt here
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/shots/${shotId}/star`, {
        method: 'POST',
      })
      const data = await res.json()

      if (res.ok) {
        setStarred(data.starred)
        setCount(prev => data.starred ? prev + 1 : prev - 1)
      }
    } catch (error) {
      console.error('Error toggling star:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggleStar}
      disabled={loading || !session?.user}
      className={`star-button ${starred ? 'starred' : ''}`}
      title={session?.user ? (starred ? 'Unstar' : 'Star') : 'Sign in to star'}
    >
      <span className="star-icon">{starred ? '★' : '☆'}</span>
      <span className="star-count">{count}</span>
    </button>
  )
}
