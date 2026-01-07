import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import type { MarkdownConfig, McpServer, PluginInfo, ModelParameters, TokenUsage } from './index.js'

interface ExtractedSession {
  prompt: string
  model: string
  sessionData: object
  timestamp: Date
  markdownConfigs?: MarkdownConfig[]
  mcpServers?: McpServer[]
  systemPrompt?: string
  modelParameters?: ModelParameters
  tokenUsage?: TokenUsage
  plugins?: PluginInfo[]
}

interface CodexEvent {
  type: string
  role?: string
  content?: string
  model?: string
  timestamp?: string
  message?: {
    role: string
    content: string
  }
  usage?: {
    input_tokens?: number
    output_tokens?: number
    total_tokens?: number
  }
  temperature?: number
  max_tokens?: number
  system?: string
}

/**
 * Get the Codex sessions directory path
 */
function getCodexSessionsPath(): string {
  const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), '.codex')
  return path.join(codexHome, 'sessions')
}

/**
 * Get the Codex config directory path
 */
function getCodexConfigPath(): string {
  return process.env.CODEX_HOME || path.join(os.homedir(), '.codex')
}

/**
 * Find markdown config files that govern Codex behavior
 */
function findMarkdownConfigs(projectPath: string): MarkdownConfig[] {
  const configs: MarkdownConfig[] = []

  // Codex-specific and common config file names
  const configNames = [
    'CODEX.md',
    'codex.md',
    '.codex.md',
    'CLAUDE.md',
    'claude.md',
    'agents.md',
    'AGENTS.md',
    'PRD.md',
    'prd.md',
    'SPEC.md',
    'spec.md',
    'INSTRUCTIONS.md',
    'instructions.md',
  ]

  for (const name of configNames) {
    const filePath = path.join(projectPath, name)
    if (fs.existsSync(filePath)) {
      try {
        configs.push({
          filename: name,
          path: filePath,
          content: fs.readFileSync(filePath, 'utf-8'),
        })
      } catch {
        // Skip unreadable files
      }
    }
  }

  // Check .codex directory
  const codexDir = path.join(projectPath, '.codex')
  if (fs.existsSync(codexDir) && fs.statSync(codexDir).isDirectory()) {
    try {
      const files = fs.readdirSync(codexDir)
      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = path.join(codexDir, file)
          try {
            configs.push({
              filename: `.codex/${file}`,
              path: filePath,
              content: fs.readFileSync(filePath, 'utf-8'),
            })
          } catch {
            // Skip unreadable files
          }
        }
      }
    } catch {
      // Skip if directory unreadable
    }
  }

  return configs
}

/**
 * Find MCP server configurations from Codex settings
 */
function findMcpServers(): McpServer[] {
  const servers: McpServer[] = []
  const configPath = getCodexConfigPath()

  // Codex stores settings in config.json or similar
  const settingsPaths = [
    path.join(configPath, 'config.json'),
    path.join(configPath, 'settings.json'),
    path.join(configPath, 'mcp.json'),
  ]

  for (const settingsPath of settingsPaths) {
    if (fs.existsSync(settingsPath)) {
      try {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))

        // Look for MCP server config
        const mcpConfig = settings.mcpServers || settings.mcp?.servers || settings.servers
        if (mcpConfig && typeof mcpConfig === 'object') {
          for (const [name, serverConfig] of Object.entries(mcpConfig)) {
            const sc = serverConfig as any
            servers.push({
              name,
              command: sc.command,
              args: sc.args,
              env: sc.env,
              url: sc.url,
            })
          }
        }
      } catch {
        // Skip invalid config files
      }
    }
  }

  return servers
}

/**
 * Detect known plugins/extensions used with Codex
 */
function detectPlugins(projectPath: string, events: CodexEvent[]): PluginInfo[] {
  const plugins: PluginInfo[] = []
  const detected = new Set<string>()

  // Check for Beads
  const beadsConfigPath = path.join(projectPath, '.beads')
  const beadsJsonPath = path.join(projectPath, 'beads.json')
  if (fs.existsSync(beadsConfigPath) || fs.existsSync(beadsJsonPath)) {
    detected.add('beads')
    let config: object | undefined
    if (fs.existsSync(beadsJsonPath)) {
      try {
        config = JSON.parse(fs.readFileSync(beadsJsonPath, 'utf-8'))
      } catch {
        // Skip invalid JSON
      }
    }
    plugins.push({ name: 'Beads', config })
  }

  // Check for Ralph Wiggum
  const ralphConfigPaths = [
    path.join(projectPath, '.ralph'),
    path.join(projectPath, '.ralphwiggum'),
    path.join(projectPath, 'ralph.config.js'),
    path.join(projectPath, 'ralph.config.json'),
  ]
  for (const configPath of ralphConfigPaths) {
    if (fs.existsSync(configPath) && !detected.has('ralph_wiggum')) {
      detected.add('ralph_wiggum')
      let config: object | undefined
      if (configPath.endsWith('.json')) {
        try {
          config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
        } catch {
          // Skip invalid JSON
        }
      }
      plugins.push({ name: 'Ralph Wiggum', config })
    }
  }

  // Detect plugins from event content patterns
  const contentStr = events
    .map(e => e.content || e.message?.content || '')
    .join(' ')

  if (contentStr.includes('[beads]') || contentStr.includes('beads:')) {
    if (!detected.has('beads')) {
      detected.add('beads')
      plugins.push({ name: 'Beads' })
    }
  }

  if (contentStr.includes('[ralph]') || contentStr.includes('ralph_wiggum')) {
    if (!detected.has('ralph_wiggum')) {
      detected.add('ralph_wiggum')
      plugins.push({ name: 'Ralph Wiggum' })
    }
  }

  return plugins
}

/**
 * Find the most recent Codex session file
 */
export async function findRecentSession(projectPath: string): Promise<string | null> {
  const sessionsPath = getCodexSessionsPath()

  if (!fs.existsSync(sessionsPath)) {
    return null
  }

  // Codex stores each session as a JSONL file
  const sessionFiles = fs.readdirSync(sessionsPath)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => ({
      name: f,
      path: path.join(sessionsPath, f),
      mtime: fs.statSync(path.join(sessionsPath, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime)

  if (sessionFiles.length === 0) {
    return null
  }

  return sessionFiles[0].path
}

/**
 * Extract prompt and model from a Codex session file
 */
export async function extractSession(sessionPath: string, projectPath: string): Promise<ExtractedSession | null> {
  const content = fs.readFileSync(sessionPath, 'utf-8')
  const lines = content.trim().split('\n')

  let userPrompt = ''
  let model = 'unknown'
  let systemPrompt: string | undefined
  let temperature: number | undefined
  let maxTokens: number | undefined
  const events: CodexEvent[] = []

  // Aggregate token usage
  const tokenUsage: TokenUsage = {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
  }

  for (const line of lines) {
    if (!line.trim()) continue

    try {
      const event = JSON.parse(line) as CodexEvent
      events.push(event)

      // Extract user prompts - keep the longest one (most likely to be the main instruction)
      // Codex uses various event types for user input
      if (event.type === 'user_prompt' || event.type === 'human') {
        if (event.content && event.content.length > userPrompt.length) {
          userPrompt = event.content
        }
      }

      // Some Codex versions use message format
      if (event.message?.role === 'user' && event.message.content.length > userPrompt.length) {
        userPrompt = event.message.content
      }

      // Extract from role-based format
      if (event.role === 'user' && event.content && event.content.length > userPrompt.length) {
        userPrompt = event.content
      }

      // Extract model info from various event types
      if (event.model) {
        model = event.model
      }

      // Codex often logs model in api_request events
      if (event.type === 'api_request' && event.model) {
        model = event.model
      }

      // Extract system prompt
      if (event.system && !systemPrompt) {
        systemPrompt = event.system
      }

      // Extract model parameters
      if (event.temperature !== undefined) {
        temperature = event.temperature
      }
      if (event.max_tokens !== undefined) {
        maxTokens = event.max_tokens
      }

      // Aggregate token usage
      if (event.usage) {
        if (event.usage.input_tokens) tokenUsage.inputTokens! += event.usage.input_tokens
        if (event.usage.output_tokens) tokenUsage.outputTokens! += event.usage.output_tokens
        if (event.usage.total_tokens) tokenUsage.totalTokens! += event.usage.total_tokens
      }
    } catch {
      // Skip invalid JSON lines
    }
  }

  if (!userPrompt) {
    return null
  }

  const stat = fs.statSync(sessionPath)

  // Build model parameters if we found any
  const modelParameters: ModelParameters | undefined = (temperature !== undefined || maxTokens !== undefined)
    ? { temperature, maxTokens }
    : undefined

  // Gather all the enhanced data
  const markdownConfigs = findMarkdownConfigs(projectPath)
  const mcpServers = findMcpServers()
  const plugins = detectPlugins(projectPath, events)

  return {
    prompt: userPrompt,
    model,
    sessionData: { events, sessionPath },
    timestamp: stat.mtime,
    markdownConfigs: markdownConfigs.length > 0 ? markdownConfigs : undefined,
    mcpServers: mcpServers.length > 0 ? mcpServers : undefined,
    systemPrompt,
    modelParameters,
    tokenUsage: tokenUsage.totalTokens! > 0 ? tokenUsage : undefined,
    plugins: plugins.length > 0 ? plugins : undefined,
  }
}

/**
 * Main function to detect and extract Codex CLI session
 */
export async function detectCodex(projectPath: string): Promise<ExtractedSession | null> {
  const sessionPath = await findRecentSession(projectPath)
  if (!sessionPath) {
    return null
  }

  return extractSession(sessionPath, projectPath)
}
