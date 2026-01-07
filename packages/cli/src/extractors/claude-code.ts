import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import type { MarkdownConfig, McpServer, PluginInfo, ModelParameters, TokenUsage } from './index.js'

interface ClaudeMessage {
  type: string
  role?: string
  content?: string | { type: string; text?: string }[]
  model?: string
  timestamp?: string
  usage?: {
    input_tokens?: number
    output_tokens?: number
    cache_read_input_tokens?: number
    cache_creation_input_tokens?: number
  }
  message?: {
    usage?: {
      input_tokens?: number
      output_tokens?: number
      cache_read_input_tokens?: number
      cache_creation_input_tokens?: number
    }
  }
  temperature?: number
  max_tokens?: number
  system?: string | { type: string; text?: string }[]
}

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

function extractText(content: string | { type: string; text?: string }[] | undefined): string {
  if (!content) return ''
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .filter(c => c.type === 'text' && c.text)
      .map(c => c.text)
      .join('\n')
  }
  return ''
}

/**
 * Find markdown config files that govern Claude Code behavior
 */
function findMarkdownConfigs(projectPath: string): MarkdownConfig[] {
  const configs: MarkdownConfig[] = []

  // Common config file names
  const configNames = [
    'CLAUDE.md',
    'claude.md',
    'agents.md',
    'AGENTS.md',
    '.claude.md',
    'PRD.md',
    'prd.md',
    'SPEC.md',
    'spec.md',
    'INSTRUCTIONS.md',
    'instructions.md',
  ]

  // Check project root
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

  // Check .claude directory
  const claudeDir = path.join(projectPath, '.claude')
  if (fs.existsSync(claudeDir) && fs.statSync(claudeDir).isDirectory()) {
    try {
      const files = fs.readdirSync(claudeDir)
      for (const file of files) {
        if (file.endsWith('.md')) {
          const filePath = path.join(claudeDir, file)
          try {
            configs.push({
              filename: `.claude/${file}`,
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

  // Check docs directory for PRDs
  const docsDir = path.join(projectPath, 'docs')
  if (fs.existsSync(docsDir) && fs.statSync(docsDir).isDirectory()) {
    try {
      const files = fs.readdirSync(docsDir)
      for (const file of files) {
        if (file.toLowerCase().includes('prd') && file.endsWith('.md')) {
          const filePath = path.join(docsDir, file)
          try {
            configs.push({
              filename: `docs/${file}`,
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
 * Find MCP server configurations from Claude Code settings
 */
function findMcpServers(): McpServer[] {
  const servers: McpServer[] = []

  // Claude Code stores MCP config in ~/.claude/settings.json or ~/.claude/claude_desktop_config.json
  const configPaths = [
    path.join(os.homedir(), '.claude', 'settings.json'),
    path.join(os.homedir(), '.claude', 'claude_desktop_config.json'),
    path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
  ]

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))

        // MCP servers are typically under mcpServers key
        if (config.mcpServers && typeof config.mcpServers === 'object') {
          for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
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
 * Detect known plugins/extensions used with Claude Code
 */
function detectPlugins(projectPath: string, messages: ClaudeMessage[]): PluginInfo[] {
  const plugins: PluginInfo[] = []
  const detected = new Set<string>()

  // Check for Beads (conversation threading/organization tool)
  const beadsConfigPath = path.join(projectPath, '.beads')
  const beadsJsonPath = path.join(projectPath, 'beads.json')
  if (fs.existsSync(beadsConfigPath) || fs.existsSync(beadsJsonPath)) {
    detected.add('beads')
    plugins.push({
      name: 'Beads',
      config: fs.existsSync(beadsJsonPath)
        ? JSON.parse(fs.readFileSync(beadsJsonPath, 'utf-8'))
        : undefined,
    })
  }

  // Check for Ralph Wiggum (prompt enhancement tool)
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
      plugins.push({
        name: 'Ralph Wiggum',
        config,
      })
    }
  }

  // Check for Aider integration markers
  const aiderConfigPath = path.join(projectPath, '.aider.conf.yml')
  if (fs.existsSync(aiderConfigPath) && !detected.has('aider')) {
    detected.add('aider')
    plugins.push({ name: 'Aider' })
  }

  // Detect plugins from message content patterns
  const contentStr = messages.map(m => extractText(m.content)).join(' ')

  // Check for common plugin signatures in conversation
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
 * Find the most recent Claude Code session for the current project
 */
export async function findRecentSession(projectPath: string): Promise<string | null> {
  const claudeDir = path.join(os.homedir(), '.claude', 'projects')

  if (!fs.existsSync(claudeDir)) {
    return null
  }

  // Claude Code organizes by project path hash
  // We need to find the directory that matches our project
  const projectDirs = fs.readdirSync(claudeDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)

  // Look for session files, find most recent
  let mostRecentFile: string | null = null
  let mostRecentTime = 0

  for (const dir of projectDirs) {
    const projectDir = path.join(claudeDir, dir)
    const files = fs.readdirSync(projectDir)
      .filter(f => f.endsWith('.jsonl'))

    for (const file of files) {
      const filePath = path.join(projectDir, file)
      const stat = fs.statSync(filePath)
      if (stat.mtimeMs > mostRecentTime) {
        mostRecentTime = stat.mtimeMs
        mostRecentFile = filePath
      }
    }
  }

  return mostRecentFile
}

/**
 * Extract prompt and model from a Claude Code session file
 */
export async function extractSession(sessionPath: string, projectPath: string): Promise<ExtractedSession | null> {
  const content = fs.readFileSync(sessionPath, 'utf-8')
  const lines = content.trim().split('\n')

  let userPrompt = ''
  let model = 'unknown'
  let systemPrompt: string | undefined
  let temperature: number | undefined
  let maxTokens: number | undefined
  const messages: ClaudeMessage[] = []

  // Aggregate token usage across all messages
  const tokenUsage: TokenUsage = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
  }

  for (const line of lines) {
    if (!line.trim()) continue

    try {
      const msg = JSON.parse(line) as ClaudeMessage
      messages.push(msg)

      // Extract user prompts
      if (msg.role === 'user' || msg.type === 'human') {
        const text = extractText(msg.content)
        if (text && !userPrompt) {
          userPrompt = text
        }
      }

      // Extract model info
      if (msg.model) {
        model = msg.model
      }

      // Extract system prompt
      if (msg.system && !systemPrompt) {
        systemPrompt = extractText(msg.system as any)
      }

      // Extract model parameters
      if (msg.temperature !== undefined) {
        temperature = msg.temperature
      }
      if (msg.max_tokens !== undefined) {
        maxTokens = msg.max_tokens
      }

      // Aggregate token usage
      const usage = msg.usage || msg.message?.usage
      if (usage) {
        if (usage.input_tokens) tokenUsage.inputTokens! += usage.input_tokens
        if (usage.output_tokens) tokenUsage.outputTokens! += usage.output_tokens
        if (usage.cache_read_input_tokens) tokenUsage.cacheReadTokens! += usage.cache_read_input_tokens
        if (usage.cache_creation_input_tokens) tokenUsage.cacheCreationTokens! += usage.cache_creation_input_tokens
      }
    } catch {
      // Skip invalid JSON lines
    }
  }

  if (!userPrompt) {
    return null
  }

  const stat = fs.statSync(sessionPath)

  // Calculate total tokens
  tokenUsage.totalTokens = (tokenUsage.inputTokens || 0) + (tokenUsage.outputTokens || 0)

  // Build model parameters if we found any
  const modelParameters: ModelParameters | undefined = (temperature !== undefined || maxTokens !== undefined)
    ? { temperature, maxTokens }
    : undefined

  // Gather all the enhanced data
  const markdownConfigs = findMarkdownConfigs(projectPath)
  const mcpServers = findMcpServers()
  const plugins = detectPlugins(projectPath, messages)

  return {
    prompt: userPrompt,
    model,
    sessionData: { messages, sessionPath },
    timestamp: stat.mtime,
    markdownConfigs: markdownConfigs.length > 0 ? markdownConfigs : undefined,
    mcpServers: mcpServers.length > 0 ? mcpServers : undefined,
    systemPrompt,
    modelParameters,
    tokenUsage: tokenUsage.totalTokens > 0 ? tokenUsage : undefined,
    plugins: plugins.length > 0 ? plugins : undefined,
  }
}

/**
 * Main function to detect and extract Claude Code session
 */
export async function detectClaudeCode(projectPath: string): Promise<ExtractedSession | null> {
  const sessionPath = await findRecentSession(projectPath)
  if (!sessionPath) {
    return null
  }

  return extractSession(sessionPath, projectPath)
}
