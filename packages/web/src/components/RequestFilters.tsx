'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState, useEffect } from 'react'
import Link from 'next/link'

interface Props {
  totalCount?: number
}

const typeOptions = [
  { value: '', label: 'All' },
  { value: 'model', label: 'Models' },
  { value: 'harness', label: 'Harnesses' },
  { value: 'hosting', label: 'Hosting' },
  { value: 'plugin', label: 'Plugins' },
  { value: 'other', label: 'Other' },
]

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'open', label: 'Open' },
  { value: 'planned', label: 'Planned' },
  { value: 'completed', label: 'Completed' },
]

export function RequestFilters({ totalCount }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '')

  const q = searchParams.get('q') || ''
  const type = searchParams.get('type') || ''
  const status = searchParams.get('status') || ''
  const sort = searchParams.get('sort') || 'upvotes'

  const hasFilters = q || type || status

  const updateParams = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/requests?${params.toString()}`)
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
    { value: 'upvotes', label: 'Top', icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="18 15 12 9 6 15"/>
      </svg>
    )},
    { value: 'newest', label: 'New', icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    )},
    { value: 'comments', label: 'Hot', icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    )},
  ]

  return (
    <div className="request-filters">
      {/* Search Bar */}
      <div className="request-search">
        <svg className="request-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          placeholder="Search requests..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="request-search-input"
        />
        {searchValue && (
          <button
            className="request-search-clear"
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
      <div className="request-sort-tabs">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            className={`request-sort-tab ${sort === option.value ? 'active' : ''}`}
            onClick={() => updateParams('sort', option.value)}
          >
            {option.icon}
            <span>{option.label}</span>
          </button>
        ))}
      </div>

      {/* Filter Pills */}
      <div className="request-filter-row">
        <div className="request-filter-pills">
          {/* Type filter */}
          <div className="request-filter-group">
            <select
              value={type}
              className="request-filter-select"
              onChange={(e) => updateParams('type', e.target.value)}
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {type && (
              <button
                className="request-filter-clear"
                onClick={() => updateParams('type', '')}
                aria-label="Clear type filter"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>

          {/* Status filter */}
          <div className="request-filter-group">
            <select
              value={status}
              className="request-filter-select"
              onChange={(e) => updateParams('status', e.target.value)}
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {status && (
              <button
                className="request-filter-clear"
                onClick={() => updateParams('status', '')}
                aria-label="Clear status filter"
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
          <Link href="/requests" className="request-clear-all">
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
