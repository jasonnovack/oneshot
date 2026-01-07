'use client'

import { useState, useEffect } from 'react'

const BANNER_DISMISSED_KEY = 'oneshot-banner-dismissed'

export function WelcomeBanner() {
  const [isDismissed, setIsDismissed] = useState(true) // Start hidden to prevent flash
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY) === 'true'
    setIsDismissed(dismissed)
    setIsLoaded(true)
  }, [])

  const handleDismiss = () => {
    localStorage.setItem(BANNER_DISMISSED_KEY, 'true')
    setIsDismissed(true)
  }

  if (!isLoaded || isDismissed) {
    return null
  }

  return (
    <div className="welcome-banner">
      <button className="banner-close" onClick={handleDismiss} aria-label="Dismiss">
        &times;
      </button>
      <h1>Welcome to Oneshot</h1>
      <p>
        The place to showcase and discover verified AI code transformations.
        One prompt, one commit, fully reproducible.
      </p>
    </div>
  )
}
