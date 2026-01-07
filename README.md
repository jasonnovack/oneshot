# Oneshot

Showcase verified AI code transformations. One prompt, one commit.

## Quick Start

### Prerequisites
- Node.js 18+
- npm
- A Neon database (free tier works)

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure database**
   ```bash
   cd packages/web
   cp .env.example .env.local
   # Edit .env.local with your Neon DATABASE_URL
   ```

3. **Push database schema**
   ```bash
   cd packages/web
   npm run db:push
   ```

4. **Start the web app**
   ```bash
   npm run dev
   ```

5. **Build the CLI**
   ```bash
   npm run build:cli
   ```

### Using the CLI

After making an AI-assisted change in your repo:

```bash
# Commit your changes
git add . && git commit -m "Add feature with AI"

# Submit to Oneshot
cd /path/to/your/repo
node /path/to/oneshot/packages/cli/dist/index.js submit --title "My AI Feature"
```

Or set up globally:
```bash
cd packages/cli
npm link
oneshot submit --title "My AI Feature"
```

## Project Structure

```
oneshot/
├── packages/
│   ├── web/          # Next.js web app (Gallery, Shot detail)
│   └── cli/          # CLI for submitting shots
├── package.json      # Root monorepo config
└── pnpm-workspace.yaml
```

## Phase 1 (Current)

This is the minimal end-to-end slice:
- CLI: `oneshot submit` with Claude Code extraction
- Web: Simple gallery + shot detail page
- API: POST /api/shots endpoint
- Auth: API key (no OAuth yet)

See the full spec at `.claude/plans/hashed-honking-raven.md`
