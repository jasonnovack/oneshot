# Oneshot CLI

Submit your AI-assisted code transformations to the [Oneshot Gallery](https://oneshot-web.vercel.app).

## Installation

### From npm (recommended)

```bash
npm install -g @oneshot/cli
```

### From source

```bash
git clone https://github.com/jasonnovack/oneshot.git
cd oneshot
npm install
npm run build:cli
cd packages/cli && npm link
```

## Quick Start

### 1. Login with GitHub

```bash
oneshot login
```

This opens your browser to authenticate with GitHub. Your credentials are stored locally at `~/.oneshot/config.json`.

### 2. Make AI-assisted changes

Use your favorite AI coding tool:
- **Claude Code** - Fully supported, automatic session extraction
- **Cursor** - Supported, automatic session extraction
- **Codex CLI** - Supported, automatic session extraction

### 3. Commit your changes

```bash
git add .
git commit -m "Add feature with AI assistance"
```

**Important**: Oneshot uses your git history to determine the "before" and "after" states. Always commit your AI-assisted changes before submitting.

### 4. Submit to Oneshot

```bash
oneshot submit --title "My AI-powered feature" --type feature
```

That's it! Your shot will appear in the gallery with:
- The prompt that generated the change
- Model and harness information
- Full git diff
- Live preview links (if using Vercel)

## Commands

### `oneshot login`

Authenticate with Oneshot using GitHub OAuth.

```bash
oneshot login [--api-url <url>]
```

Options:
- `--api-url` - Override the API URL (default: `https://oneshot-web.vercel.app`)

### `oneshot logout`

Log out and clear stored credentials.

```bash
oneshot logout
```

### `oneshot whoami`

Show the currently logged-in user.

```bash
oneshot whoami
```

### `oneshot submit`

Submit your latest AI-assisted commit as a shot.

```bash
oneshot submit [options]
```

Options:
- `--title <title>` - Shot title (prompted if not provided)
- `--type <type>` - Transformation type: `feature`, `fix`, `refactor`, `ui`, `test`, `docs`, `other` (default: `feature`)
- `--tags <tags>` - Comma-separated tags (e.g., `react,typescript,api`)
- `--harness <harness>` - Override auto-detection: `claude_code`, `cursor`, `codex`
- `--before-preview-url <url>` - Override auto-detected before preview URL
- `--after-preview-url <url>` - Override auto-detected after preview URL
- `--api-url <url>` - Override the API URL

**Example:**

```bash
oneshot submit \
  --title "Add dark mode toggle" \
  --type ui \
  --tags "react,tailwind,theming"
```

### `oneshot vercel-login`

Connect your Vercel account for automatic deployment URL detection.

```bash
oneshot vercel-login
```

When connected, Oneshot automatically finds Vercel preview deployments for your before/after commits and includes them in your shot.

### `oneshot vercel-logout`

Disconnect Vercel integration.

```bash
oneshot vercel-logout
```

## How It Works

When you run `oneshot submit`:

1. **Reads git state** - Gets HEAD as "after" commit, finds "before" commit based on session timing
2. **Detects AI harness** - Looks for Claude Code, Cursor, or Codex session files
3. **Extracts session data** - Parses the prompt, model, and context from your session
4. **Finds the right prompt** - Traces the message history to find the exact prompt that led to your commit
5. **Computes diff** - Generates the git diff between before and after
6. **Detects deployments** - If Vercel is connected, finds preview URLs for both commits
7. **Uploads to Oneshot** - Submits everything to the gallery

## Supported Harnesses

| Harness | Status | Session Location |
|---------|--------|------------------|
| Claude Code | Full support | `~/.claude/projects/` |
| Cursor | Full support | VSCode workspace storage |
| Codex CLI | Full support | `~/.codex/sessions/` |

The CLI automatically detects which harness you used based on recent session files.

## Configuration

Credentials are stored in `~/.oneshot/config.json`:

```json
{
  "apiUrl": "https://oneshot-web.vercel.app",
  "token": "your-session-token",
  "user": {
    "id": "...",
    "username": "your-github-username"
  }
}
```

Vercel credentials (if connected) are stored in `~/.oneshot/vercel.json`.

## Troubleshooting

### "No session detected"

The CLI couldn't find a recent AI harness session. Make sure you:
1. Made changes using a supported harness (Claude Code, Cursor, Codex)
2. The session happened recently (within the last few hours)
3. You're running `oneshot submit` from the same project directory

You can manually specify session details when prompted, or use the `--harness` flag.

### "Need at least 2 commits"

Oneshot needs a "before" and "after" commit to show the transformation. Make sure you:
1. Have at least 2 commits in your repo
2. Committed your AI-assisted changes before running submit

### "Not logged in"

Run `oneshot login` to authenticate with GitHub.

### Wrong prompt detected

If the CLI detects the wrong prompt, it might be because:
1. You made multiple commits in one session
2. The session file has multiple conversation threads

The CLI tries to find the prompt that led to the specific commit by tracing the message history. If it's still wrong, you can enter the prompt manually when prompted.

## Privacy

- **Session data**: Only the prompt, model info, and metadata are uploaded. Full conversation logs stay local.
- **Credentials**: Stored locally in `~/.oneshot/`. Never sent anywhere except the Oneshot API.
- **Git data**: Only commit hashes and diffs are uploaded. Your full repo is not cloned or stored.

## Feedback

Found a bug or have a feature request? [Open an issue](https://github.com/jasonnovack/oneshot/issues).
