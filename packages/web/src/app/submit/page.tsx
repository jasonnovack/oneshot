export default function SubmitPage() {
  return (
    <div className="submit-page">
      <h1>How to Submit a Shot</h1>

      <p className="intro">
        A "shot" is a verified AI-powered code transformation. One prompt, one commit,
        fully reproducible. Here's how to submit yours:
      </p>

      <div className="steps">
        <div className="step">
          <div className="step-number">1</div>
          <div className="step-content">
            <h3>Use an AI Coding Tool</h3>
            <p>
              Make a code change using one of the supported AI harnesses:
            </p>
            <ul>
              <li><strong>Claude Code</strong> - Anthropic's CLI coding assistant</li>
              <li><strong>Cursor</strong> - AI-powered code editor</li>
              <li><strong>Codex CLI</strong> - OpenAI's command-line tool</li>
            </ul>
          </div>
        </div>

        <div className="step">
          <div className="step-number">2</div>
          <div className="step-content">
            <h3>Commit Your Changes</h3>
            <p>
              Stage and commit the AI-generated changes to git:
            </p>
            <pre><code>git add .
git commit -m "Your descriptive commit message"</code></pre>
          </div>
        </div>

        <div className="step">
          <div className="step-number">3</div>
          <div className="step-content">
            <h3>Install the Oneshot CLI</h3>
            <p>
              Install our command-line tool globally via npm:
            </p>
            <pre><code>npm install -g oneshot-cli</code></pre>
          </div>
        </div>

        <div className="step">
          <div className="step-number">4</div>
          <div className="step-content">
            <h3>Log In (Optional)</h3>
            <p>
              Authenticate with your GitHub account to get credited for your shots:
            </p>
            <pre><code>oneshot login</code></pre>
          </div>
        </div>

        <div className="step">
          <div className="step-number">5</div>
          <div className="step-content">
            <h3>Connect Vercel (Optional)</h3>
            <p>
              If your project deploys to Vercel, connect it to auto-detect preview URLs:
            </p>
            <pre><code>oneshot vercel-login</code></pre>
            <p className="note">
              You'll need a Vercel API token from{' '}
              <a href="https://vercel.com/account/tokens" target="_blank" rel="noopener noreferrer">
                vercel.com/account/tokens
              </a>
            </p>
            <div className="warning-panel">
              <strong>Important:</strong> Vercel preview deployments must be public for viewers to see them.
              Go to Project Settings → Deployment Protection and set it to "Only Preview Deployments from a PR"
              or disable protection entirely.
            </div>
          </div>
        </div>

        <div className="step">
          <div className="step-number">6</div>
          <div className="step-content">
            <h3>Submit Your Shot</h3>
            <p>
              Run the submit command from your repo root:
            </p>
            <pre><code>oneshot submit --title "Your shot title" --type feature</code></pre>
            <p className="note">
              The CLI auto-detects your AI session and extracts the prompt, model, and settings.
            </p>
          </div>
        </div>
      </div>

      <div className="shot-types">
        <h2>Shot Types</h2>
        <p>Choose the type that best describes your transformation:</p>
        <ul>
          <li><code>feature</code> - Adding new functionality</li>
          <li><code>fix</code> - Bug fixes, error handling</li>
          <li><code>refactor</code> - Restructuring without changing behavior</li>
          <li><code>ui</code> - Styling, layout, visual changes</li>
          <li><code>test</code> - Adding or improving tests</li>
          <li><code>docs</code> - Documentation generation</li>
          <li><code>other</code> - Anything else</li>
        </ul>
      </div>

      <div className="cli-options">
        <h2>CLI Options</h2>
        <pre><code>{`oneshot submit [options]

Options:
  --title <title>           Shot title (required)
  --type <type>             Transformation type (default: feature)
  --tags <tags>             Comma-separated tags
  --harness <harness>       Override harness detection
  --before-preview-url      Override before preview URL
  --after-preview-url       Override after preview URL
  --api-url <url>           API base URL`}</code></pre>
      </div>

      <div className="verification">
        <h2>How Verification Works</h2>
        <p>
          Each shot is verified through multiple mechanisms:
        </p>
        <ul>
          <li><strong>Git commit hashes</strong> - Anchor the before/after states immutably</li>
          <li><strong>Session extraction</strong> - Parse AI session data directly from harness logs</li>
          <li><strong>Timestamp correlation</strong> - Verify session timing aligns with commits</li>
          <li><strong>Content hashing</strong> - Prove session data hasn't been modified post-submission</li>
        </ul>
      </div>
    </div>
  )
}
