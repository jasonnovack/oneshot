'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import Link from 'next/link'

interface Props {
  harnessOptions: string[]
  typeOptions: string[]
}

export function GalleryFilters({ harnessOptions, typeOptions }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const q = searchParams.get('q') || ''
  const harness = searchParams.get('harness') || ''
  const type = searchParams.get('type') || ''
  const sort = searchParams.get('sort') || 'newest'

  const hasFilters = q || harness || type

  const updateParams = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/?${params.toString()}`)
  }, [router, searchParams])

  // Debounce text input updates
  const handleTextChange = useCallback((key: string, value: string) => {
    // Use a short delay for text inputs to avoid too many navigations
    const timeoutId = setTimeout(() => {
      updateParams(key, value)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [updateParams])

  return (
    <div className="filters">
      <input
        type="text"
        placeholder="Search shots..."
        defaultValue={q}
        className="search-input"
        onChange={(e) => handleTextChange('q', e.target.value)}
      />
      <select
        value={harness}
        className="filter-select"
        onChange={(e) => updateParams('harness', e.target.value)}
      >
        <option value="">All harnesses</option>
        {harnessOptions.map((h) => (
          <option key={h} value={h}>{h}</option>
        ))}
      </select>
      <select
        value={type}
        className="filter-select"
        onChange={(e) => updateParams('type', e.target.value)}
      >
        <option value="">All types</option>
        {typeOptions.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>
      <select
        value={sort}
        className="filter-select"
        onChange={(e) => updateParams('sort', e.target.value)}
      >
        <option value="newest">Newest</option>
        <option value="stars">Most Starred</option>
        <option value="comments">Most Discussed</option>
      </select>
      {hasFilters && (
        <Link href="/" className="clear-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
          Clear filters
        </Link>
      )}
    </div>
  )
}
