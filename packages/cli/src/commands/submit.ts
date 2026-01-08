import { simpleGit } from 'simple-git'
import { detectHarness, type ExtractedSession } from '../extractors/index.js'
import { loadConfig } from './login.js'
import { detectVercelDeployments, loadVercelConfig } from './vercel.js'
import * as readline from 'readline'

interface SubmitOptions {
  harness?: string
  title?: string
  type: string
  tags?: string
  apiUrl: string
  beforePreviewUrl?: string
  afterPreviewUrl?: string
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

  // Get git info FIRST - we need the commit hash for prompt extraction
  console.log('📦 Reading git state...')

  const log = await git.log({ maxCount: 50 })
  if (log.all.length < 2) {
    console.error('❌ Need at least 2 commits. BEFORE = commit before session, AFTER = HEAD.')
    process.exit(1)
  }

  const afterCommit = log.all[0]
  let beforeCommit = log.all[1] // Default to HEAD~1

  console.log(`   AFTER:  ${afterCommit.hash.slice(0, 7)} - ${afterCommit.message.split('\n')[0]}`)

  // Detect harness and extract session with the commit hash
  // This allows us to find the specific prompt that led to this commit
  console.log('🔍 Detecting AI harness...')

  let session: ExtractedSession | null = null

  // Try auto-detection with optional harness preference, passing the commit hash
  session = await detectHarness(cwd, options.harness, afterCommit.hash)

  // Refine "before" commit using session timestamp if available
  if (session?.timestamp) {
    const sessionTime = session.timestamp.getTime()
    // Find the first commit (excluding HEAD) that predates the session
    for (let i = 1; i < log.all.length; i++) {
      const commit = log.all[i]
      const commitTime = new Date(commit.date).getTime()
      if (commitTime < sessionTime) {
        beforeCommit = commit
        break
      }
    }
  }

  console.log(`   BEFORE: ${beforeCommit.hash.slice(0, 7)} - ${beforeCommit.message.split('\n')[0]}`)

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

  // Print session info if found
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

  // Auto-detect Vercel deployment URLs (if Vercel is connected)
  let beforePreviewUrl = options.beforePreviewUrl
  let afterPreviewUrl = options.afterPreviewUrl

  if (!beforePreviewUrl || !afterPreviewUrl) {
    const vercelConfig = loadVercelConfig()
    if (vercelConfig) {
      console.log('\n🔍 Detecting Vercel deployments...')
      const deployments = await detectVercelDeployments(
        repoUrl,
        beforeCommit.hash,
        afterCommit.hash
      )

      if (deployments.beforeUrl || deployments.afterUrl) {
        // Check public accessibility
        const hasPrivateDeployments =
          (deployments.beforeUrl && !deployments.beforePublic) ||
          (deployments.afterUrl && !deployments.afterPublic)

        if (hasPrivateDeployments) {
          console.log('\n   ⚠️  Vercel deployments require authentication!')
          console.log('   Viewers won\'t be able to see the preview without Vercel access.\n')
          console.log('   To make deployments public:')
          console.log('   1. Go to your Vercel project settings')
          console.log('   2. Navigate to "Deployment Protection"')
          console.log('   3. Set protection to "Only Preview Deployments from a PR"')
          console.log('      or disable protection entirely\n')

          const continueAnyway = await prompt('   Continue without preview URLs? (y/N): ')
          if (continueAnyway.toLowerCase() !== 'y') {
            console.log('\n   Skipping preview URLs. Fix Vercel settings and try again.')
            beforePreviewUrl = undefined
            afterPreviewUrl = undefined
          } else {
            // Include URLs but warn they're private
            if (deployments.beforeUrl && !beforePreviewUrl) {
              beforePreviewUrl = deployments.beforePublic ? deployments.beforeUrl : undefined
              if (deployments.beforePublic) {
                console.log(`   ✓ Before: ${beforePreviewUrl}`)
              }
            }
            if (deployments.afterUrl && !afterPreviewUrl) {
              afterPreviewUrl = deployments.afterPublic ? deployments.afterUrl : undefined
              if (deployments.afterPublic) {
                console.log(`   ✓ After: ${afterPreviewUrl}`)
              }
            }
          }
        } else {
          // All deployments are public
          if (deployments.beforeUrl && !beforePreviewUrl) {
            beforePreviewUrl = deployments.beforeUrl
            console.log(`   ✓ Before: ${beforePreviewUrl}`)
          }
          if (deployments.afterUrl && !afterPreviewUrl) {
            afterPreviewUrl = deployments.afterUrl
            console.log(`   ✓ After: ${afterPreviewUrl}`)
          }
        }
      } else {
        console.log('   ⚠️  No Vercel deployments found for these commits')
      }
    }
  }

  // Prepare payload with session metadata (exclude full conversation to reduce payload size)
  const { messages, ...sessionMetadata } = session.sessionData as { messages?: unknown[], [key: string]: unknown }
  const enhancedSessionData = {
    ...sessionMetadata,
    messageCount: Array.isArray(messages) ? messages.length : undefined,
    markdownConfigs: session.markdownConfigs,
    mcpServers: session.mcpServers,
    systemPrompt: session.systemPrompt ? session.systemPrompt.slice(0, 1000) + '...' : undefined,
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
    beforePreviewUrl,
    afterPreviewUrl,
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
    if (config.user?.id) {
      headers['X-User-Id'] = config.user.id
    }
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
