# Claude Code Instructions for Oneshot

## Always Commit at End of Every Prompt

After completing any prompt that makes changes to the codebase, always commit and push:

```bash
git add -A && git commit -m "<descriptive message>" && git push
```

## After Completing Impressive Work

When you complete a prompt that is impressive in scope & impact to the app (new features, significant fixes, major refactors), run:

```bash
cd /Users/jasonnovack/projects/oneshot
oneshot submit --type <type> --title "<descriptive title>"
```

Types: `feature`, `fix`, `refactor`, `ui`, `test`, `docs`, `other`

This captures the AI-assisted transformation as a "shot" on the Oneshot platform, showcasing verified AI code transformations.

### Prerequisites
- Must be logged in: `oneshot login`
- Vercel integration (for preview URLs): `oneshot vercel-login`

### What makes a shot "impressive"?
- Adds meaningful new functionality
- Fixes a non-trivial bug
- Refactors code in a significant way
- Creates notable UI/UX improvements
- Any change that demonstrates AI coding capabilities well
