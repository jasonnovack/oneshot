import { simpleGit } from 'simple-git'
import { detectHarness, type ExtractedSession } from '../extractors/index.js'
import { loadConfig } from './login.js'
import * as readline from 'readline'

interface SubmitOptions {
  harness?: string
  title?: string
  type: string
  tags?: string
  apiUrl: string
}

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

const harnessNames: Record<string, string> = {
  claude_code: 'Claude Code',
  cursor: 'Cursor',
  codex: 'Codex CLI',
}

export async function submit(options: SubmitOptions) {
  const cwd = process.cwd()
  const git = simpleGit(cwd)

  console.log('\n🎯 Oneshot Submit\n')

  // Check if we're in a git repo
  const isRepo = await git.checkIsRepo()
  if (!isRepo) {
    console.error('❌ Not a git repository. Please run from a git repo root.')
    process.exit(1)
  }

  // Get git info
  console.log('📦 Reading git state...')

  const log = await git.log({ maxCount: 2 })
  if (log.all.length < 2) {
    console.error('❌ Need at least 2 commits. BEFORE = HEAD~1, AFTER = HEAD.')
    process.exit(1)
  }

  const afterCommit = log.all[0]
  const beforeCommit = log.all[1]

  console.log(`   BEFORE: ${beforeCommit.hash.slice(0, 7)} - ${beforeCommit.message.split('\n')[0]}`)
  console.log(`   AFTER:  ${afterCommit.hash.slice(0, 7)} - ${afterCommit.message.split('\n')[0]}`)

  // Get diff
  const diff = await git.diff([beforeCommit.hash, afterCommit.hash])
  if (!diff.trim()) {
    console.error('❌ No changes between commits.')
    process.exit(1)
  }

  const diffLines = diff.split('\n').length
  console.log(`   Diff: ${diffLines} lines\n`)

  // Get remote URL
  let repoUrl = ''
  try {
    const remotes = await git.getRemotes(true)
    const origin = remotes.find(r => r.name === 'origin')
    if (origin?.refs.fetch) {
      repoUrl = origin.refs.fetch
        .replace(/^git@github\.com:/, 'https://github.com/')
        .replace(/\.git$/, '')
    }
  } catch {
    // No remote, that's okay
  }

  if (!repoUrl) {
    repoUrl = await prompt('🔗 Repo URL (GitHub, etc.): ')
  }

  // Detect harness and extract session
  console.log('🔍 Detecting AI harness...')

  let session: ExtractedSession | null = null

  // Try auto-detection with optional harness preference
  session = await detectHarness(cwd, options.harness)

  if (session) {
    console.log(`   ✓ Found ${harnessNames[session.harness] || session.harness} session`)
    console.log(`   Model: ${session.model}`)
    console.log(`   Prompt: "${session.prompt.slice(0, 60)}${session.prompt.length > 60 ? '...' : ''}"`)
  } else {
    console.log('   ⚠️  No session detected. You can enter details manually.')

    const manualPrompt = await prompt('\n📝 What was your prompt? ')
    const manualModel = await prompt('🤖 What model did you use? ')
    const manualHarness = await prompt('🔧 What harness? (claude_code, cursor, codex): ')

    session = {
      prompt: manualPrompt,
      model: manualModel,
      sessionData: { manual: true },
      timestamp: new Date(),
      harness: (manualHarness || 'claude_code') as ExtractedSession['harness'],
    }
  }

  // Get title
  let title = options.title
  if (!title) {
    title = await prompt('\n📌 Shot title: ')
  }

  // Validate type
  const validTypes = ['feature', 'fix', 'refactor', 'ui', 'test', 'docs', 'other']
  if (!validTypes.includes(options.type)) {
    console.error(`❌ Invalid type. Must be one of: ${validTypes.join(', ')}`)
    process.exit(1)
  }

  // Parse tags
  const tags = options.tags ? options.tags.split(',').map(t => t.trim()) : []

  // Prepare payload with enhanced session data
  const enhancedSessionData = {
    ...session.sessionData,
    markdownConfigs: session.markdownConfigs,
    mcpServers: session.mcpServers,
    systemPrompt: session.systemPrompt,
    modelParameters: session.modelParameters,
    tokenUsage: session.tokenUsage,
    plugins: session.plugins,
  }

  const payload = {
    title,
    type: options.type,
    tags,
    repoUrl,
    beforeCommitHash: beforeCommit.hash,
    afterCommitHash: afterCommit.hash,
    diff,
    harness: session.harness,
    model: session.model,
    prompt: session.prompt,
    sessionData: enhancedSessionData,
  }

  // Submit to API
  console.log('\n🚀 Submitting to Oneshot...')

  // Try to use saved config, fall back to API key
  const config = loadConfig()
  const apiUrl = config?.apiUrl || options.apiUrl
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (config?.token) {
    headers['Authorization'] = `Bearer ${config.token}`
    console.log(`   Authenticated as @${config.user.username}`)
  } else {
    const apiKey = process.env.ONESHOT_API_KEY || ''
    if (apiKey) {
      headers['x-api-key'] = apiKey
    } else {
      console.log('   ⚠️  Not logged in. Run: oneshot login')
      console.log('   (Submitting without authentication...)')
    }
  }

  try {
    const response = await fetch(`${apiUrl}/api/shots`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error(`❌ Failed to submit: ${error.error || response.statusText}`)
      process.exit(1)
    }

    const result = await response.json()
    console.log('\n✅ Shot submitted successfully!')
    console.log(`\n🔗 View your shot: ${result.shot.url}\n`)
  } catch (error) {
    console.error(`❌ Failed to connect to API: ${error}`)
    process.exit(1)
  }
}
