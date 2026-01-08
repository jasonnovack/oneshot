'use client'

import { useState, useRef, useEffect } from 'react'

interface ShareButtonProps {
  shotId: string
  title: string
  model: string
  harness: string
  thumbnailUrl?: string
}

export function ShareButton({ shotId, title, model, harness, thumbnailUrl }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const shotUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/shots/${shotId}`
    : `https://oneshot.sh/shots/${shotId}`

  // Format harness name for display
  const harnessDisplay = harness
    .replace('_', ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  // Share text that doesn't mention Oneshot
  const shareText = `${title}\n\nBuilt with ${model} via ${harnessDisplay}`

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const shareToX = () => {
    const url = new URL('https://x.com/intent/tweet')
    url.searchParams.set('text', shareText)
    url.searchParams.set('url', shotUrl)
    window.open(url.toString(), '_blank', 'width=550,height=420')
    setIsOpen(false)
  }

  const shareToLinkedIn = () => {
    const url = new URL('https://www.linkedin.com/sharing/share-offsite/')
    url.searchParams.set('url', shotUrl)
    window.open(url.toString(), '_blank', 'width=550,height=420')
    setIsOpen(false)
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shotUrl)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        setIsOpen(false)
      }, 1500)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="share-button-container" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="share-button"
        title="Share this shot"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        <span>Share</span>
      </button>

      {isOpen && (
        <div className="share-menu">
          <button onClick={shareToX} className="share-menu-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Post to X
          </button>
          <button onClick={shareToLinkedIn} className="share-menu-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            Post to LinkedIn
          </button>
          <button onClick={copyLink} className="share-menu-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      )}
    </div>
  )
}
