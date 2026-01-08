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
        Explore what developers are building with AI coding tools.
        Each shot shows exactly what prompt, model, and setup produced the result—so you can learn and level up your own workflow.
      </p>
    </div>
  )
}
