import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import Database from 'better-sqlite3'
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

interface CursorMessage {
  role: string
  content: string
  model?: string
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

interface CursorConversation {
  messages?: CursorMessage[]
  model?: string
  lastModified?: number
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

/**
 * Get the Cursor workspace storage path for the current OS
 */
function getCursorStoragePath(): string {
  const platform = os.platform()
  const home = os.homedir()

  if (platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'Cursor', 'User', 'workspaceStorage')
  } else if (platform === 'win32') {
    return path.join(process.env.APPDATA || '', 'Cursor', 'User', 'workspaceStorage')
  } else {
    // Linux
    return path.join(home, '.config', 'Cursor', 'User', 'workspaceStorage')
  }
}

/**
 * Get the Cursor config path for the current OS
 */
function getCursorConfigPath(): string {
  const platform = os.platform()
  const home = os.homedir()

  if (platform === 'darwin') {
    return path.join(home, 'Library', 'Application Support', 'Cursor', 'User')
  } else if (platform === 'win32') {
    return path.join(process.env.APPDATA || '', 'Cursor', 'User')
  } else {
    return path.join(home, '.config', 'Cursor', 'User')
  }
}

/**
 * Find markdown config files that govern Cursor behavior
 */
function findMarkdownConfigs(projectPath: string): MarkdownConfig[] {
  const configs: MarkdownConfig[] = []

  // Cursor-specific and common config file names
  const configNames = [
    '.cursorrules',
    'CURSOR.md',
    'cursor.md',
    '.cursor/rules.md',
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

  // Check .cursor directory
  const cursorDir = path.join(projectPath, '.cursor')
  if (fs.existsSync(cursorDir) && fs.statSync(cursorDir).isDirectory()) {
    try {
      const files = fs.readdirSync(cursorDir)
      for (const file of files) {
        if (file.endsWith('.md') || file === 'rules') {
          const filePath = path.join(cursorDir, file)
          try {
            configs.push({
              filename: `.cursor/${file}`,
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
 * Find MCP server configurations from Cursor settings
 */
function findMcpServers(): McpServer[] {
  const servers: McpServer[] = []
  const configPath = getCursorConfigPath()

  // Cursor stores settings in settings.json
  const settingsPaths = [
    path.join(configPath, 'settings.json'),
    path.join(configPath, 'globalStorage', 'mcp-config.json'),
  ]

  for (const settingsPath of settingsPaths) {
    if (fs.existsSync(settingsPath)) {
      try {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))

        // Look for MCP server config
        const mcpConfig = settings.mcpServers || settings['mcp.servers'] || settings.mcp?.servers
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
 * Detect known plugins/extensions used with Cursor
 */
function detectPlugins(projectPath: string): PluginInfo[] {
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

  // Check Cursor extensions directory for known plugins
  const cursorConfigPath = getCursorConfigPath()
  const extensionsPath = path.join(path.dirname(cursorConfigPath), 'extensions')
  if (fs.existsSync(extensionsPath)) {
    try {
      const extensions = fs.readdirSync(extensionsPath)
      // Look for known extension patterns
      for (const ext of extensions) {
        if (ext.toLowerCase().includes('beads') && !detected.has('beads')) {
          detected.add('beads')
          plugins.push({ name: 'Beads' })
        }
        if (ext.toLowerCase().includes('ralph') && !detected.has('ralph_wiggum')) {
          detected.add('ralph_wiggum')
          plugins.push({ name: 'Ralph Wiggum' })
        }
      }
    } catch {
      // Skip if unreadable
    }
  }

  return plugins
}

/**
 * Find the most recent Cursor session database
 */
export async function findRecentSession(projectPath: string): Promise<string | null> {
  const storagePath = getCursorStoragePath()

  if (!fs.existsSync(storagePath)) {
    return null
  }

  // Cursor organizes by workspace hash
  const workspaceDirs = fs.readdirSync(storagePath, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)

  let mostRecentDb: string | null = null
  let mostRecentTime = 0

  for (const dir of workspaceDirs) {
    const dbPath = path.join(storagePath, dir, 'state.vscdb')
    if (fs.existsSync(dbPath)) {
      const stat = fs.statSync(dbPath)
      if (stat.mtimeMs > mostRecentTime) {
        mostRecentTime = stat.mtimeMs
        mostRecentDb = dbPath
      }
    }
  }

  return mostRecentDb
}

/**
 * Extract chat data from Cursor's SQLite database
 */
export async function extractSession(dbPath: string, projectPath: string): Promise<ExtractedSession | null> {
  let db: Database.Database | null = null

  try {
    db = new Database(dbPath, { readonly: true })

    // Cursor stores AI chat data in the ItemTable with specific keys
    const chatKeys = [
      'workbench.panel.aichat.view.aichat.chatdata',
      'aiService.prompts',
    ]

    let chatData: any = null

    for (const key of chatKeys) {
      const row = db.prepare('SELECT value FROM ItemTable WHERE key = ?').get(key) as { value: string } | undefined
      if (row?.value) {
        try {
          chatData = JSON.parse(row.value)
          break
        } catch {
          // Try next key
        }
      }
    }

    if (!chatData) {
      return null
    }

    // Extract the most recent conversation
    let messages: CursorMessage[] = []
    let model = 'unknown'
    let systemPrompt: string | undefined
    let temperature: number | undefined
    let maxTokens: number | undefined
    let conversation: CursorConversation | null = null

    if (Array.isArray(chatData)) {
      // Format: array of conversations
      conversation = chatData[chatData.length - 1] as CursorConversation
      if (conversation?.messages) {
        messages = conversation.messages
        model = conversation.model || 'unknown'
      }
    } else if (chatData.messages) {
      // Format: single conversation object
      conversation = chatData as CursorConversation
      messages = chatData.messages
      model = chatData.model || 'unknown'
    } else if (chatData.tabs) {
      // Format: tabbed conversations
      const tabs = Object.values(chatData.tabs) as CursorConversation[]
      conversation = tabs.sort((a, b) => (b.lastModified || 0) - (a.lastModified || 0))[0]
      if (conversation?.messages) {
        messages = conversation.messages
        model = conversation.model || 'unknown'
      }
    }

    // Extract system prompt and parameters from conversation
    if (conversation) {
      systemPrompt = conversation.systemPrompt
      temperature = conversation.temperature
      maxTokens = conversation.maxTokens
    }

    // Find the first user message as the prompt
    const userMessage = messages.find(m => m.role === 'user')
    if (!userMessage) {
      return null
    }

    // Extract model from messages if not found
    if (model === 'unknown') {
      const assistantMsg = messages.find(m => m.role === 'assistant' && m.model)
      if (assistantMsg?.model) {
        model = assistantMsg.model
      }
    }

    // Aggregate token usage
    const tokenUsage: TokenUsage = {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    }

    for (const msg of messages) {
      if (msg.usage) {
        if (msg.usage.prompt_tokens) tokenUsage.inputTokens! += msg.usage.prompt_tokens
        if (msg.usage.completion_tokens) tokenUsage.outputTokens! += msg.usage.completion_tokens
        if (msg.usage.total_tokens) tokenUsage.totalTokens! += msg.usage.total_tokens
      }
    }

    const stat = fs.statSync(dbPath)

    // Build model parameters if we found any
    const modelParameters: ModelParameters | undefined = (temperature !== undefined || maxTokens !== undefined)
      ? { temperature, maxTokens }
      : undefined

    // Gather all the enhanced data
    const markdownConfigs = findMarkdownConfigs(projectPath)
    const mcpServers = findMcpServers()
    const plugins = detectPlugins(projectPath)

    return {
      prompt: userMessage.content,
      model,
      sessionData: { messages, dbPath },
      timestamp: stat.mtime,
      markdownConfigs: markdownConfigs.length > 0 ? markdownConfigs : undefined,
      mcpServers: mcpServers.length > 0 ? mcpServers : undefined,
      systemPrompt,
      modelParameters,
      tokenUsage: tokenUsage.totalTokens! > 0 ? tokenUsage : undefined,
      plugins: plugins.length > 0 ? plugins : undefined,
    }
  } catch (error) {
    console.error('Error reading Cursor database:', error)
    return null
  } finally {
    if (db) {
      db.close()
    }
  }
}

/**
 * Main function to detect and extract Cursor session
 */
export async function detectCursor(projectPath: string): Promise<ExtractedSession | null> {
  const dbPath = await findRecentSession(projectPath)
  if (!dbPath) {
    return null
  }

  return extractSession(dbPath, projectPath)
}
