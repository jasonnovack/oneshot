import { detectClaudeCode } from './claude-code.js'
import { detectCursor } from './cursor.js'
import { detectCodex } from './codex.js'

export interface MarkdownConfig {
  filename: string
  path: string
  content: string
}

export interface McpServer {
  name: string
  command?: string
  args?: string[]
  env?: Record<string, string>
  url?: string
}

export interface PluginInfo {
  name: string
  version?: string
  config?: object
}

export interface ModelParameters {
  temperature?: number
  maxTokens?: number
  topP?: number
  topK?: number
  stopSequences?: string[]
  [key: string]: unknown
}

export interface TokenUsage {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  cacheReadTokens?: number
  cacheCreationTokens?: number
}

export interface ExtractedSession {
  prompt: string
  model: string
  sessionData: object
  timestamp: Date
  harness: 'claude_code' | 'cursor' | 'codex'
  // Enhanced fields
  markdownConfigs?: MarkdownConfig[]
  mcpServers?: McpServer[]
  systemPrompt?: string
  modelParameters?: ModelParameters
  tokenUsage?: TokenUsage
  plugins?: PluginInfo[]
}

interface DetectionResult {
  session: ExtractedSession | null
  harness: string
}

/**
 * Auto-detect which AI harness was used and extract the session
 * Returns the most recent session across all harnesses
 */
export async function detectHarness(projectPath: string, preferredHarness?: string): Promise<ExtractedSession | null> {
  const results: DetectionResult[] = []

  // If a specific harness is requested, only try that one
  if (preferredHarness) {
    let session = null
    switch (preferredHarness) {
      case 'claude_code':
        session = await detectClaudeCode(projectPath)
        break
      case 'cursor':
        session = await detectCursor(projectPath)
        break
      case 'codex':
        session = await detectCodex(projectPath)
        break
    }
    if (session) {
      return { ...session, harness: preferredHarness as ExtractedSession['harness'] }
    }
    return null
  }

  // Try all harnesses and collect results
  const claudeSession = await detectClaudeCode(projectPath)
  if (claudeSession) {
    results.push({ session: { ...claudeSession, harness: 'claude_code' }, harness: 'claude_code' })
  }

  const cursorSession = await detectCursor(projectPath)
  if (cursorSession) {
    results.push({ session: { ...cursorSession, harness: 'cursor' }, harness: 'cursor' })
  }

  const codexSession = await detectCodex(projectPath)
  if (codexSession) {
    results.push({ session: { ...codexSession, harness: 'codex' }, harness: 'codex' })
  }

  if (results.length === 0) {
    return null
  }

  // Return the most recent session
  results.sort((a, b) => {
    const timeA = a.session?.timestamp.getTime() || 0
    const timeB = b.session?.timestamp.getTime() || 0
    return timeB - timeA
  })

  return results[0].session
}

/**
 * List all detected sessions across harnesses (for debugging/selection)
 */
export async function listSessions(projectPath: string): Promise<ExtractedSession[]> {
  const sessions: ExtractedSession[] = []

  const claudeSession = await detectClaudeCode(projectPath)
  if (claudeSession) {
    sessions.push({ ...claudeSession, harness: 'claude_code' })
  }

  const cursorSession = await detectCursor(projectPath)
  if (cursorSession) {
    sessions.push({ ...cursorSession, harness: 'cursor' })
  }

  const codexSession = await detectCodex(projectPath)
  if (codexSession) {
    sessions.push({ ...codexSession, harness: 'codex' })
  }

  return sessions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}
