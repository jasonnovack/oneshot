import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import * as readline from 'readline'

interface VercelConfig {
  token: string
}

interface VercelDeployment {
  uid: string
  url: string
  state: string
  meta?: {
    githubCommitSha?: string
    gitCommitSha?: string
  }
}

interface VercelProject {
  id: string
  name: string
  link?: {
    type: string
    repo: string
    repoId: number
  }
}

const CONFIG_PATH = path.join(os.homedir(), '.oneshot', 'vercel.json')

function prompt(question: string): Promise<string> {
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

export function loadVercelConfig(): VercelConfig | null {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'))
    }
  } catch {
    // Config doesn't exist or is invalid
  }
  return null
}

function saveVercelConfig(config: VercelConfig) {
  const dir = path.dirname(CONFIG_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2))
}

/**
 * Login to Vercel - stores API token
 */
export async function vercelLogin() {
  console.log('\n🔗 Vercel Integration Setup\n')
  console.log('To automatically detect Vercel deployment URLs, you need a Vercel API token.')
  console.log('')
  console.log('1. Go to: https://vercel.com/account/tokens')
  console.log('2. Create a new token with "Read" scope')
  console.log('3. Copy and paste it below\n')

  const token = await prompt('Vercel API Token: ')

  if (!token.trim()) {
    console.error('❌ No token provided')
    process.exit(1)
  }

  // Verify the token works
  console.log('\n🔍 Verifying token...')
  try {
    const response = await fetch('https://api.vercel.com/v2/user', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      console.error('❌ Invalid token or API error')
      process.exit(1)
    }

    const user = await response.json()
    console.log(`✅ Authenticated as: ${user.user.username || user.user.email}`)

    saveVercelConfig({ token })
    console.log('\n✓ Vercel token saved. Deployment URLs will be auto-detected on submit.\n')
  } catch (error) {
    console.error(`❌ Failed to verify token: ${error}`)
    process.exit(1)
  }
}

/**
 * Logout from Vercel
 */
export function vercelLogout() {
  if (fs.existsSync(CONFIG_PATH)) {
    fs.unlinkSync(CONFIG_PATH)
    console.log('✓ Vercel token removed')
  } else {
    console.log('Not logged in to Vercel')
  }
}

/**
 * Find Vercel project for a GitHub repo
 */
async function findVercelProject(token: string, repoUrl: string): Promise<VercelProject | null> {
  // Extract owner/repo from GitHub URL
  const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/)
  if (!match) return null

  const [, owner, repo] = match
  const repoFullName = `${owner}/${repo}`

  try {
    // List all projects and find one linked to this repo
    const response = await fetch('https://api.vercel.com/v9/projects?limit=100', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) return null

    const data = await response.json()
    const projects = data.projects as VercelProject[]

    // Find project linked to this GitHub repo
    for (const project of projects) {
      if (project.link?.type === 'github') {
        // The repo field might be just repo name or owner/repo
        const linkedRepo = project.link.repo
        if (linkedRepo === repoFullName || linkedRepo === repo) {
          return project
        }
      }
    }
  } catch {
    // API error
  }

  return null
}

/**
 * Find deployment URL for a specific commit
 */
async function findDeploymentForCommit(
  token: string,
  projectId: string,
  commitSha: string
): Promise<string | null> {
  try {
    // Query deployments for this project, filter by commit
    const response = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=100`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!response.ok) return null

    const data = await response.json()
    const deployments = data.deployments as VercelDeployment[]

    // Find deployment matching this commit SHA
    for (const deployment of deployments) {
      const deployCommit = deployment.meta?.githubCommitSha || deployment.meta?.gitCommitSha
      if (deployCommit === commitSha && deployment.state === 'READY') {
        // Return the deployment URL (add https:// if needed)
        const url = deployment.url
        return url.startsWith('http') ? url : `https://${url}`
      }
    }
  } catch {
    // API error
  }

  return null
}

/**
 * Auto-detect Vercel deployment URLs for before/after commits
 */
export async function detectVercelDeployments(
  repoUrl: string,
  beforeCommitSha: string,
  afterCommitSha: string
): Promise<{ beforeUrl: string | null; afterUrl: string | null }> {
  const config = loadVercelConfig()
  if (!config?.token) {
    return { beforeUrl: null, afterUrl: null }
  }

  // Find the Vercel project for this repo
  const project = await findVercelProject(config.token, repoUrl)
  if (!project) {
    return { beforeUrl: null, afterUrl: null }
  }

  // Find deployments for both commits
  const [beforeUrl, afterUrl] = await Promise.all([
    findDeploymentForCommit(config.token, project.id, beforeCommitSha),
    findDeploymentForCommit(config.token, project.id, afterCommitSha),
  ])

  return { beforeUrl, afterUrl }
}
