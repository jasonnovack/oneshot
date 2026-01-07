'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Comment {
  comment: {
    id: string
    content: string
    createdAt: string
  }
  user: {
    id: string
    username: string
    avatarUrl: string | null
  } | null
}

interface CommentsProps {
  shotId: string
}

export function Comments({ shotId }: CommentsProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/shots/${shotId}/comments`)
      .then(res => res.json())
      .then(data => {
        setComments(data.comments || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching comments:', err)
        setLoading(false)
      })
  }, [shotId])

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.trim() || !session?.user) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/shots/${shotId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      })

      if (res.ok) {
        const data = await res.json()
        setComments(prev => [data.comment, ...prev])
        setNewComment('')
      }
    } catch (error) {
      console.error('Error posting comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="comments-section">
      <h3>Comments ({comments.length})</h3>

      {session?.user ? (
        <form onSubmit={submitComment} className="comment-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            maxLength={2000}
            rows={3}
          />
          <button type="submit" disabled={submitting || !newComment.trim()}>
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <p className="sign-in-prompt">
          <Link href="/api/auth/signin">Sign in</Link> to leave a comment
        </p>
      )}

      {loading ? (
        <div className="loading">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="no-comments">No comments yet. Be the first to share your thoughts!</div>
      ) : (
        <div className="comments-list">
          {comments.map(({ comment, user }) => (
            <article key={comment.id} className="comment">
              <div className="comment-header">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} className="comment-avatar" />
                ) : (
                  <div className="comment-avatar" style={{ background: 'var(--surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    {user?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div className="comment-meta">
                  <Link href={`/u/${user?.username}`} className="comment-author">
                    @{user?.username}
                  </Link>
                  <span className="comment-date">{formatDate(comment.createdAt)}</span>
                </div>
              </div>
              <p className="comment-content">{comment.content}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
