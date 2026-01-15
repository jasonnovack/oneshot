# Oneshot

**Showcase verified AI code transformations. One prompt, one commit.**

Oneshot is a platform where developers share reproducible AI-powered code transformations. Each "shot" captures exactly what prompt, model, and tool produced a specific code change—so others can learn, verify, and replicate impressive results.

## How It Works

1. **Create** - Use an AI coding tool (Claude Code, Cursor, Codex) to make changes
2. **Commit** - Commit your AI-assisted changes to git
3. **Submit** - Run `oneshot submit` to capture the shot
4. **Share** - Your shot appears in the gallery with full provenance

Each shot includes:
- The exact prompt you used
- Model and tool information
- Git diff (before/after commits)
- Live preview links (if available)
- Token usage and generation stats

## Submit your work to the Oneshot gallery

Install the CLI and start sharing your AI-assisted work.

**[Get started with the CLI →](./packages/cli/README.md)**

Quick preview:

```bash
# Install the CLI
npm install -g oneshot-cli

# Login with GitHub
oneshot login

# After making AI-assisted changes, commit and submit
git add . && git commit -m "Add feature with Claude"
oneshot submit --title "Built a feature with AI" --type feature
```

## Contribute to the project

Run Oneshot locally and help build the platform.

### Prerequisites

- Node.js 18+
- npm
- A Neon database (free tier works)
- GitHub OAuth app credentials

### Development Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/jasonnovack/oneshot.git
   cd oneshot
   npm install
   ```

2. **Configure environment**
   ```bash
   cd packages/web
   cp .env.example .env.local
   ```

   Edit `.env.local` with:
   - `DATABASE_URL` - Your Neon Postgres connection string
   - `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - GitHub OAuth credentials
   - `NEXTAUTH_SECRET` - Random string for session encryption
   - `NEXTAUTH_URL` - `http://localhost:3000` for local dev

3. **Initialize database**
   ```bash
   npm run db:push
   ```

4. **Start development**
   ```bash
   npm run dev
   ```

   This starts the web app at `http://localhost:3000`

5. **Build the CLI** (optional, for testing)
   ```bash
   npm run build:cli
   cd packages/cli && npm link
   ```

### Project Structure

```
oneshot/
├── packages/
│   ├── web/          # Next.js web app (Gallery, API, Auth)
│   └── cli/          # CLI for submitting shots
├── package.json      # Root monorepo config
└── README.md
```

## Links

- **Gallery**: [oneshot-web.vercel.app](https://oneshot-web.vercel.app)
- **CLI Docs**: [packages/cli/README.md](./packages/cli/README.md)

## License

MIT
