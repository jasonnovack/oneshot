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
    <button onClick={handleCopy} className="copy-btn" title={`Copy ${label}`}>
      {copied ? '✓ Copied' : `Copy ${label}`}
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
    <div className="recipe-panel">
      <h3>Recipe</h3>

      <div className="recipe-section">
        <div className="recipe-header">
          <span className="recipe-label">Model</span>
        </div>
        <div className="recipe-value">
          <code>{model}</code>
        </div>
      </div>

      <div className="recipe-section">
        <div className="recipe-header">
          <span className="recipe-label">Harness</span>
        </div>
        <div className="recipe-value">
          {harnessNames[harness] || harness}
        </div>
      </div>

      {/* Model Parameters */}
      {parsedSession?.modelParameters && (
        <div className="recipe-section">
          <div className="recipe-header">
            <span className="recipe-label">Model Parameters</span>
          </div>
          <div className="recipe-value" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {parsedSession.modelParameters.temperature !== undefined && (
              <span><code>temperature: {parsedSession.modelParameters.temperature}</code></span>
            )}
            {parsedSession.modelParameters.maxTokens !== undefined && (
              <span><code>max_tokens: {parsedSession.modelParameters.maxTokens}</code></span>
            )}
            {parsedSession.modelParameters.topP !== undefined && (
              <span><code>top_p: {parsedSession.modelParameters.topP}</code></span>
            )}
            {parsedSession.modelParameters.topK !== undefined && (
              <span><code>top_k: {parsedSession.modelParameters.topK}</code></span>
            )}
          </div>
        </div>
      )}

      {/* Token Usage */}
      {parsedSession?.tokenUsage && (
        <div className="recipe-section">
          <div className="recipe-header">
            <span className="recipe-label">Token Usage</span>
          </div>
          <div className="recipe-value" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {parsedSession.tokenUsage.inputTokens !== undefined && (
              <span>Input: <code>{formatTokens(parsedSession.tokenUsage.inputTokens)}</code></span>
            )}
            {parsedSession.tokenUsage.outputTokens !== undefined && (
              <span>Output: <code>{formatTokens(parsedSession.tokenUsage.outputTokens)}</code></span>
            )}
            {parsedSession.tokenUsage.totalTokens !== undefined && (
              <span>Total: <code>{formatTokens(parsedSession.tokenUsage.totalTokens)}</code></span>
            )}
            {parsedSession.tokenUsage.cacheReadTokens !== undefined && parsedSession.tokenUsage.cacheReadTokens > 0 && (
              <span>Cache Read: <code>{formatTokens(parsedSession.tokenUsage.cacheReadTokens)}</code></span>
            )}
          </div>
        </div>
      )}

      {/* Plugins */}
      {parsedSession?.plugins && parsedSession.plugins.length > 0 && (
        <div className="recipe-section">
          <div className="recipe-header">
            <span className="recipe-label">Plugins</span>
          </div>
          <div className="recipe-value" style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {parsedSession.plugins.map((plugin, i) => (
              <span key={i} className="badge" style={{ background: 'rgba(0, 112, 243, 0.2)', color: 'var(--accent)' }}>
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
            <span className="recipe-label">MCP Servers</span>
          </div>
          <div className="recipe-value">
            {parsedSession.mcpServers.map((server, i) => (
              <div key={i} style={{ marginBottom: '0.5rem' }}>
                <code>{server.name}</code>
                {server.command && (
                  <span style={{ color: 'var(--muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                    ({server.command}{server.args ? ` ${server.args.join(' ')}` : ''})
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="recipe-section">
        <div className="recipe-header">
          <span className="recipe-label">Prompt</span>
          <CopyButton text={prompt} label="Prompt" />
        </div>
        <div className="prompt-box">
          {prompt}
        </div>
      </div>

      {/* System Prompt */}
      {parsedSession?.systemPrompt && (
        <div className="recipe-section">
          <div className="recipe-header">
            <span className="recipe-label">System Prompt</span>
            <CopyButton text={parsedSession.systemPrompt} label="System Prompt" />
          </div>
          <div className="prompt-box" style={{ maxHeight: '200px', overflow: 'auto' }}>
            {parsedSession.systemPrompt}
          </div>
        </div>
      )}

      {/* Markdown Config Files */}
      {parsedSession?.markdownConfigs && parsedSession.markdownConfigs.length > 0 && (
        <div className="recipe-section">
          <div className="recipe-header">
            <span className="recipe-label">Config Files</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {parsedSession.markdownConfigs.map((config, i) => (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => toggleConfig(config.filename)}
                    className="toggle-btn"
                    style={{ padding: '0.25rem 0.5rem' }}
                  >
                    {expandedConfigs.has(config.filename) ? '▼' : '▶'} {config.filename}
                  </button>
                  <CopyButton text={config.content} label={config.filename} />
                </div>
                {expandedConfigs.has(config.filename) && (
                  <div className="prompt-box" style={{ marginTop: '0.5rem', maxHeight: '300px', overflow: 'auto' }}>
                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{config.content}</pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {parsedSession && !parsedSession.manual && (
        <div className="recipe-section">
          <div className="recipe-header">
            <span className="recipe-label">Raw Session Data</span>
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="toggle-btn"
            >
              {showRaw ? 'Hide' : 'Show'} Raw
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

      <div className="recipe-tip">
        <strong>Tip:</strong> Copy the prompt and adapt it for your own project.
        The key is understanding why this prompt worked, not reproducing it exactly.
      </div>
    </div>
  )
}
