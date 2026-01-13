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

interface RequestCommentsProps {
  requestId: string
}

export function RequestComments({ requestId }: RequestCommentsProps) {
  const { data: session } = useSession()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Fetch comments on mount
  useEffect(() => {
    fetch(`/api/requests/${requestId}/comments`)
      .then(res => res.json())
      .then(data => {
        setComments(data.comments || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching comments:', err)
        setLoading(false)
      })
  }, [requestId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return

    setSubmitting(true)

    try {
      const res = await fetch(`/api/requests/${requestId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      })

      if (res.ok) {
        const data = await res.json()
        setComments(prev => [data.comment, ...prev])
        setNewComment('')
      }
    } catch (err) {
      console.error('Error posting comment:', err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="request-comments-loading">
        <div className="request-comments-spinner" />
        Loading comments...
      </div>
    )
  }

  return (
    <div className="request-comments">
      {/* Comment Form */}
      {session?.user ? (
        <form onSubmit={handleSubmit} className="request-comment-form">
          <img
            src={session.user.image || '/default-avatar.png'}
            alt=""
            className="request-comment-form-avatar"
          />
          <div className="request-comment-form-input-wrapper">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              maxLength={2000}
              rows={3}
              className="request-comment-form-textarea"
            />
            <div className="request-comment-form-actions">
              <span className="request-comment-form-hint">
                {newComment.length}/2000
              </span>
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="request-comment-form-submit"
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="request-comments-signin">
          <Link href="/api/auth/signin">Sign in</Link> to leave a comment
        </div>
      )}

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="request-comments-empty">
          No comments yet. Be the first to share your thoughts!
        </div>
      ) : (
        <div className="request-comments-list">
          {comments.map(({ comment, user }) => (
            <div key={comment.id} className="request-comment">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="request-comment-avatar" />
              ) : (
                <div className="request-comment-avatar-placeholder" />
              )}
              <div className="request-comment-content">
                <div className="request-comment-header">
                  {user ? (
                    <Link href={`/u/${user.username}`} className="request-comment-author">
                      @{user.username}
                    </Link>
                  ) : (
                    <span className="request-comment-author-anon">Anonymous</span>
                  )}
                  <span className="request-comment-time">
                    {new Date(comment.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <p className="request-comment-text">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
