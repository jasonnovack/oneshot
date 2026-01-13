'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const typeOptions = [
  {
    value: 'model',
    label: 'Model',
    description: 'Request support for a new AI model (GPT-4, Gemini, etc.)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 1v6m0 6v10M4.22 4.22l4.24 4.24m7.08 7.08l4.24 4.24M1 12h6m6 0h10M4.22 19.78l4.24-4.24m7.08-7.08l4.24-4.24"/>
      </svg>
    ),
  },
  {
    value: 'harness',
    label: 'Harness',
    description: 'Request support for a new coding assistant (Aider, Windsurf, etc.)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
  },
  {
    value: 'hosting',
    label: 'Hosting',
    description: 'Request support for a hosting service for preview URLs (Netlify, Railway, etc.)',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
        <line x1="8" y1="21" x2="16" y2="21"/>
        <line x1="12" y1="17" x2="12" y2="21"/>
      </svg>
    ),
  },
  {
    value: 'plugin',
    label: 'Plugin',
    description: 'Request support for a Claude Code plugin or extension',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    ),
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Request something else or suggest a new feature',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
  },
]

export function RequestForm() {
  const router = useRouter()
  const [type, setType] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [link, setLink] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!type) {
      setError('Please select a request type')
      return
    }

    if (!title.trim()) {
      setError('Please enter a title')
      return
    }

    if (!description.trim()) {
      setError('Please enter a description')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim(),
          link: link.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to submit request')
        return
      }

      // Redirect to the new request
      router.push(`/requests/${data.request.id}`)
    } catch (err) {
      setError('An error occurred. Please try again.')
      console.error('Error submitting request:', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="request-form">
      {/* Type Selection */}
      <div className="request-form-section">
        <label className="request-form-label">What are you requesting?</label>
        <div className="request-type-grid">
          {typeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`request-type-option ${type === option.value ? 'selected' : ''}`}
              onClick={() => setType(option.value)}
            >
              <div className="request-type-icon">{option.icon}</div>
              <div className="request-type-info">
                <span className="request-type-label">{option.label}</span>
                <span className="request-type-desc">{option.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div className="request-form-section">
        <label htmlFor="title" className="request-form-label">
          Title
          <span className="request-form-required">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Add support for GPT-4 Turbo"
          maxLength={100}
          className="request-form-input"
        />
        <span className="request-form-hint">{title.length}/100 characters</span>
      </div>

      {/* Description */}
      <div className="request-form-section">
        <label htmlFor="description" className="request-form-label">
          Description
          <span className="request-form-required">*</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Why do you want this? How would you use it?"
          maxLength={2000}
          rows={5}
          className="request-form-textarea"
        />
        <span className="request-form-hint">{description.length}/2000 characters</span>
      </div>

      {/* Link (optional) */}
      <div className="request-form-section">
        <label htmlFor="link" className="request-form-label">
          Reference Link
          <span className="request-form-optional">(optional)</span>
        </label>
        <input
          id="link"
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://..."
          className="request-form-input"
        />
        <span className="request-form-hint">Link to documentation, website, or repo</span>
      </div>

      {/* Error */}
      {error && (
        <div className="request-form-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* Submit */}
      <div className="request-form-actions">
        <button
          type="submit"
          disabled={submitting}
          className="request-form-submit"
        >
          {submitting ? (
            <>
              <svg className="request-form-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Submitting...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Submit Request
            </>
          )}
        </button>
      </div>
    </form>
  )
}
