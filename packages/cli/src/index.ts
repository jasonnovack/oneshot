#!/usr/bin/env node

import { Command } from 'commander'
import { submit } from './commands/submit.js'
import { login, logout, whoami } from './commands/login.js'
import { vercelLogin, vercelLogout } from './commands/vercel.js'

const program = new Command()

program
  .name('oneshot')
  .description('Submit verified AI code transformations to Oneshot')
  .version('0.1.0')

program
  .command('login')
  .description('Authenticate with Oneshot via GitHub')
  .option('--api-url <url>', 'API base URL', 'https://oneshot-web.vercel.app')
  .action(login)

program
  .command('logout')
  .description('Log out of Oneshot')
  .action(logout)

program
  .command('whoami')
  .description('Show current logged in user')
  .action(whoami)

program
  .command('submit')
  .description('Submit your latest AI-assisted commit as a shot')
  .option('--harness <harness>', 'Override harness detection (claude_code, cursor, codex)')
  .option('--title <title>', 'Shot title')
  .option('--type <type>', 'Transformation type (feature, fix, refactor, ui, test, docs, other)', 'feature')
  .option('--tags <tags>', 'Comma-separated tags')
  .option('--before-preview-url <url>', 'Override auto-detected before preview URL')
  .option('--after-preview-url <url>', 'Override auto-detected after preview URL')
  .option('--api-url <url>', 'API base URL', 'https://oneshot-web.vercel.app')
  .action(submit)

program
  .command('vercel-login')
  .description('Connect Vercel for automatic deployment URL detection')
  .action(vercelLogin)

program
  .command('vercel-logout')
  .description('Disconnect Vercel integration')
  .action(vercelLogout)

program.parse()
