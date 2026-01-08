'use client'

import { useState } from 'react'

interface MarkdownConfig {
  filename: string
  content: string
}

interface McpServer {
  name: string
  command?: string
  args?: string[]
}

interface PluginInfo {
  name: string
  version?: string
}

interface ModelParameters {
  temperature?: number
  maxTokens?: number
  topP?: number
  topK?: number
}

interface TokenUsage {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  cacheReadTokens?: number
  cacheCreationTokens?: number
}

interface ParsedSessionData {
  manual?: boolean
  markdownConfigs?: MarkdownConfig[]
  mcpServers?: McpServer[]
  systemPrompt?: string
  modelParameters?: ModelParameters
  tokenUsage?: TokenUsage
  plugins?: PluginInfo[]
}

interface RecipePanelProps {
  prompt: string
  model: string
  harness: string
  sessionData?: string | null
}

// Icon components for recipe sections
function IconCopy() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <button onClick={handleCopy} className={`copy-btn ${copied ? 'copied' : ''}`} title={`Copy ${label}`}>
      {copied ? <IconCheck /> : <IconCopy />}
      <span>{copied ? 'Copied!' : 'Copy'}</span>
    </button>
  )
}

export function RecipePanel({ prompt, model, harness, sessionData }: RecipePanelProps) {
  const [showRaw, setShowRaw] = useState(false)
  const [expandedConfigs, setExpandedConfigs] = useState<Set<string>>(new Set())

  const harnessNames: Record<string, string> = {
    claude_code: 'Claude Code',
    cursor: 'Cursor',
    codex: 'Codex CLI',
  }

  // Parse session data if available
  let parsedSession: ParsedSessionData | null = null
  try {
    if (sessionData) {
      parsedSession = JSON.parse(sessionData)
    }
  } catch {
    // Invalid JSON, ignore
  }

  const toggleConfig = (filename: string) => {
    const newExpanded = new Set(expandedConfigs)
    if (newExpanded.has(filename)) {
      newExpanded.delete(filename)
    } else {
      newExpanded.add(filename)
    }
    setExpandedConfigs(newExpanded)
  }

  const formatTokens = (n: number): string => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  return (
    <section className="recipe-panel">
      <header className="recipe-panel-header">
        <h3>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          Recipe
        </h3>
        <p className="recipe-panel-subtitle">Everything you need to reproduce this transformation</p>
      </header>

      {/* Prompt Section - Hero of the Recipe */}
      <div className="recipe-section recipe-section-prompt">
        <div className="recipe-header">
          <span className="recipe-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Prompt
          </span>
          <CopyButton text={prompt} label="Prompt" />
        </div>
        <div className="prompt-box">
          {prompt}
        </div>
      </div>

      {/* Quick Info Grid */}
      <div className="recipe-info-grid">
        <div className="recipe-info-card">
          <span className="recipe-info-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v10M4.22 4.22l4.24 4.24m7.08 7.08l4.24 4.24M1 12h6m6 0h10M4.22 19.78l4.24-4.24m7.08-7.08l4.24-4.24"/>
            </svg>
          </span>
          <span className="recipe-info-label">Model</span>
          <span className="recipe-info-value"><code>{model}</code></span>
        </div>
        <div className="recipe-info-card">
          <span className="recipe-info-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </span>
          <span className="recipe-info-label">Harness</span>
          <span className="recipe-info-value">{harnessNames[harness] || harness}</span>
        </div>
      </div>

      {/* Token Usage */}
      {parsedSession?.tokenUsage && (
        <div className="recipe-section">
          <div className="recipe-header">
            <span className="recipe-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20V10"/>
                <path d="M18 20V4"/>
                <path d="M6 20v-4"/>
              </svg>
              Token Usage
            </span>
          </div>
          <div className="recipe-tokens">
            {parsedSession.tokenUsage.inputTokens !== undefined && (
              <div className="recipe-token-stat">
                <span className="recipe-token-label">Input</span>
                <span className="recipe-token-value">{formatTokens(parsedSession.tokenUsage.inputTokens)}</span>
              </div>
            )}
            {parsedSession.tokenUsage.outputTokens !== undefined && (
              <div className="recipe-token-stat">
                <span className="recipe-token-label">Output</span>
                <span className="recipe-token-value">{formatTokens(parsedSession.tokenUsage.outputTokens)}</span>
              </div>
            )}
            {parsedSession.tokenUsage.totalTokens !== undefined && (
              <div className="recipe-token-stat recipe-token-total">
                <span className="recipe-token-label">Total</span>
                <span className="recipe-token-value">{formatTokens(parsedSession.tokenUsage.totalTokens)}</span>
              </div>
            )}
            {parsedSession.tokenUsage.cacheReadTokens !== undefined && parsedSession.tokenUsage.cacheReadTokens > 0 && (
              <div className="recipe-token-stat recipe-token-cache">
                <span className="recipe-token-label">Cached</span>
                <span className="recipe-token-value">{formatTokens(parsedSession.tokenUsage.cacheReadTokens)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Model Parameters */}
      {parsedSession?.modelParameters && (
        <div className="recipe-section">
          <div className="recipe-header">
            <span className="recipe-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              Parameters
            </span>
          </div>
          <div className="recipe-params">
            {parsedSession.modelParameters.temperature !== undefined && (
              <span className="recipe-param"><code>temp: {parsedSession.modelParameters.temperature}</code></span>
            )}
            {parsedSession.modelParameters.maxTokens !== undefined && (
              <span className="recipe-param"><code>max: {parsedSession.modelParameters.maxTokens}</code></span>
            )}
            {parsedSession.modelParameters.topP !== undefined && (
              <span className="recipe-param"><code>top_p: {parsedSession.modelParameters.topP}</code></span>
            )}
            {parsedSession.modelParameters.topK !== undefined && (
              <span className="recipe-param"><code>top_k: {parsedSession.modelParameters.topK}</code></span>
            )}
          </div>
        </div>
      )}

      {/* Plugins */}
      {parsedSession?.plugins && parsedSession.plugins.length > 0 && (
        <div className="recipe-section">
          <div className="recipe-header">
            <span className="recipe-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
              </svg>
              Plugins
            </span>
          </div>
          <div className="recipe-plugins">
            {parsedSession.plugins.map((plugin, i) => (
              <span key={i} className="recipe-plugin-badge">
                {plugin.name}{plugin.version ? ` v${plugin.version}` : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* MCP Servers */}
      {parsedSession?.mcpServers && parsedSession.mcpServers.length > 0 && (
        <div className="recipe-section">
          <div className="recipe-header">
            <span className="recipe-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
                <line x1="6" y1="6" x2="6.01" y2="6"/>
                <line x1="6" y1="18" x2="6.01" y2="18"/>
              </svg>
              MCP Servers
            </span>
          </div>
          <div className="recipe-mcp-list">
            {parsedSession.mcpServers.map((server, i) => (
              <div key={i} className="recipe-mcp-item">
                <code>{server.name}</code>
                {server.command && (
                  <span className="recipe-mcp-command">
                    {server.command}{server.args ? ` ${server.args.join(' ')}` : ''}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* System Prompt */}
      {parsedSession?.systemPrompt && (
        <div className="recipe-section">
          <div className="recipe-header">
            <span className="recipe-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
              System Prompt
            </span>
            <CopyButton text={parsedSession.systemPrompt} label="System Prompt" />
          </div>
          <div className="prompt-box prompt-box-compact">
            {parsedSession.systemPrompt}
          </div>
        </div>
      )}

      {/* Markdown Config Files */}
      {parsedSession?.markdownConfigs && parsedSession.markdownConfigs.length > 0 && (
        <div className="recipe-section">
          <div className="recipe-header">
            <span className="recipe-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                <polyline points="13 2 13 9 20 9"/>
              </svg>
              Config Files
            </span>
          </div>
          <div className="recipe-configs">
            {parsedSession.markdownConfigs.map((config, i) => (
              <div key={i} className="recipe-config-item">
                <button
                  onClick={() => toggleConfig(config.filename)}
                  className="recipe-config-toggle"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ transform: expandedConfigs.has(config.filename) ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
                  >
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                  <code>{config.filename}</code>
                </button>
                <CopyButton text={config.content} label={config.filename} />
                {expandedConfigs.has(config.filename) && (
                  <div className="recipe-config-content">
                    <pre>{config.content}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Session Data */}
      {parsedSession && !parsedSession.manual && (
        <div className="recipe-section recipe-section-raw">
          <div className="recipe-header">
            <span className="recipe-label">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="4 17 10 11 4 5"/>
                <line x1="12" y1="19" x2="20" y2="19"/>
              </svg>
              Raw Session Data
            </span>
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="recipe-toggle-btn"
            >
              {showRaw ? 'Hide' : 'Show'}
            </button>
          </div>
          {showRaw && (
            <div className="raw-session">
              <CopyButton text={sessionData || ''} label="Session JSON" />
              <pre>{JSON.stringify(parsedSession, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* Tip */}
      <div className="recipe-tip">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        <div>
          <strong>Pro tip:</strong> Copy the prompt and adapt it for your own project.
          The key is understanding <em>why</em> this prompt worked, not reproducing it exactly.
        </div>
      </div>
    </section>
  )
}
