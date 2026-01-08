'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Props {
  harnessOptions: string[]
  typeOptions: string[]
  totalCount?: number
}

const harnessNames: Record<string, string> = {
  claude_code: 'Claude Code',
  cursor: 'Cursor',
  codex: 'Codex CLI',
}

const typeLabels: Record<string, string> = {
  feature: 'Feature',
  fix: 'Fix',
  refactor: 'Refactor',
  ui: 'UI',
  test: 'Test',
  docs: 'Docs',
  other: 'Other',
}

export function GalleryFilters({ harnessOptions, typeOptions }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '')

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

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchValue !== q) {
        updateParams('q', searchValue)
      }
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchValue, q, updateParams])

  const sortOptions = [
    { value: 'newest', label: 'New', icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    )},
    { value: 'stars', label: 'Top', icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="18 15 12 9 6 15"/>
      </svg>
    )},
    { value: 'comments', label: 'Hot', icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    )},
  ]

  return (
    <div className="gallery-filters">
      {/* Search Bar */}
      <div className="gallery-search">
        <svg className="gallery-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search shots..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="gallery-search-input"
        />
        {searchValue && (
          <button
            className="gallery-search-clear"
            onClick={() => setSearchValue('')}
            aria-label="Clear search"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* Sort Tabs */}
      <div className="gallery-sort-tabs">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            className={`gallery-sort-tab ${sort === option.value ? 'active' : ''}`}
            onClick={() => updateParams('sort', option.value)}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        ))}
      </div>

      {/* Filter Pills */}
      <div className="gallery-filter-row">
        <div className="gallery-filter-pills">
          {/* Harness filter */}
          <div className="gallery-filter-group">
            <select
              value={harness}
              className="gallery-filter-select"
              onChange={(e) => updateParams('harness', e.target.value)}
            >
              <option value="">All harnesses</option>
              {harnessOptions.map((h) => (
                <option key={h} value={h}>{harnessNames[h] || h}</option>
              ))}
            </select>
            {harness && (
              <button
                className="gallery-filter-clear"
                onClick={() => updateParams('harness', '')}
                aria-label="Clear harness filter"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>

          {/* Type filter */}
          <div className="gallery-filter-group">
            <select
              value={type}
              className="gallery-filter-select"
              onChange={(e) => updateParams('type', e.target.value)}
            >
              <option value="">All types</option>
              {typeOptions.map((t) => (
                <option key={t} value={t}>{typeLabels[t] || t}</option>
              ))}
            </select>
            {type && (
              <button
                className="gallery-filter-clear"
                onClick={() => updateParams('type', '')}
                aria-label="Clear type filter"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Clear all */}
        {hasFilters && (
          <Link href="/" className="gallery-clear-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
            <span>Clear all</span>
          </Link>
        )}
      </div>
    </div>
  )
}
