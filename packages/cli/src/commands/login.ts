import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import * as readline from 'readline'

interface LoginOptions {
  apiUrl: string
}

interface DeviceCodeResponse {
  device_code: string
  user_code: string
  verification_uri: string
  expires_in: number
  interval: number
}

interface TokenResponse {
  access_token: string
  user: {
    id: string
    username: string
    name: string | null
  }
}

function getConfigPath(): string {
  return path.join(os.homedir(), '.oneshot', 'config.json')
}

function ensureConfigDir(): void {
  const dir = path.dirname(getConfigPath())
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export function saveConfig(config: { apiUrl: string; token: string; user: TokenResponse['user'] }): void {
  ensureConfigDir()
  fs.writeFileSync(getConfigPath(), JSON.stringify(config, null, 2))
}

export function loadConfig(): { apiUrl: string; token: string; user: TokenResponse['user'] } | null {
  const configPath = getConfigPath()
  if (!fs.existsSync(configPath)) {
    return null
  }
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  } catch {
    return null
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function openBrowser(url: string): Promise<void> {
  const { exec } = await import('child_process')
  const platform = os.platform()

  let command: string
  if (platform === 'darwin') {
    command = `open "${url}"`
  } else if (platform === 'win32') {
    command = `start "${url}"`
  } else {
    command = `xdg-open "${url}"`
  }

  exec(command, (error) => {
    if (error) {
      console.log(`\n   Could not open browser automatically.`)
      console.log(`   Please open this URL manually: ${url}`)
    }
  })
}

export async function login(options: LoginOptions) {
  console.log('\n🔐 Oneshot Login\n')

  // Check if already logged in
  const existing = loadConfig()
  if (existing?.token) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    const answer = await new Promise<string>(resolve => {
      rl.question(`   Already logged in as @${existing.user.username}. Log out and re-login? (y/N) `, resolve)
    })
    rl.close()

    if (answer.toLowerCase() !== 'y') {
      console.log('   Cancelled.\n')
      return
    }
  }

  console.log('   Requesting device code...')

  // Request device code
  let deviceResponse: DeviceCodeResponse
  try {
    const res = await fetch(`${options.apiUrl}/api/auth/device`, {
      method: 'POST',
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    deviceResponse = await res.json()
  } catch (error) {
    console.error(`\n❌ Failed to connect to Oneshot server: ${error}`)
    console.error(`   Make sure ${options.apiUrl} is running.\n`)
    process.exit(1)
  }

  console.log('\n   Your code is:\n')
  console.log(`   ┌─────────────────┐`)
  console.log(`   │  ${deviceResponse.user_code}  │`)
  console.log(`   └─────────────────┘\n`)

  console.log(`   Opening browser to: ${deviceResponse.verification_uri}`)
  console.log(`   Enter the code above to authorize this device.\n`)

  // Open browser
  await openBrowser(`${deviceResponse.verification_uri}?code=${deviceResponse.user_code}`)

  // Poll for authorization
  console.log('   Waiting for authorization...')

  const startTime = Date.now()
  const expiresAt = startTime + deviceResponse.expires_in * 1000

  while (Date.now() < expiresAt) {
    await sleep(deviceResponse.interval * 1000)

    try {
      const res = await fetch(
        `${options.apiUrl}/api/auth/device?device_code=${deviceResponse.device_code}`
      )

      if (res.status === 428) {
        // Still pending
        process.stdout.write('.')
        continue
      }

      if (res.ok) {
        const tokenResponse: TokenResponse = await res.json()

        // Save config
        saveConfig({
          apiUrl: options.apiUrl,
          token: tokenResponse.access_token,
          user: tokenResponse.user,
        })

        console.log('\n')
        console.log(`✅ Logged in as @${tokenResponse.user.username}!\n`)
        console.log(`   You can now submit shots with: oneshot submit\n`)
        return
      }

      const error = await res.json()
      if (error.error === 'expired_token') {
        console.log('\n\n❌ Code expired. Please try again.\n')
        process.exit(1)
      }
    } catch (error) {
      // Network error, keep trying
      process.stdout.write('.')
    }
  }

  console.log('\n\n❌ Authorization timed out. Please try again.\n')
  process.exit(1)
}

export async function logout() {
  const configPath = getConfigPath()
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath)
    console.log('\n✅ Logged out successfully.\n')
  } else {
    console.log('\n   Not logged in.\n')
  }
}

export async function whoami() {
  const config = loadConfig()
  if (config?.user) {
    console.log(`\n   Logged in as @${config.user.username}`)
    console.log(`   API: ${config.apiUrl}\n`)
  } else {
    console.log('\n   Not logged in. Run: oneshot login\n')
  }
}
