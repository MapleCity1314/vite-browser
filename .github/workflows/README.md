# GitHub Actions Workflows

This directory contains automated workflows for the vite-browser project.

## Workflows

### `publish.yml` - Publish to npm

Automatically publishes the package to npm when a version tag is pushed.

**Trigger**: Push tags matching `v*.*.*` (e.g., `v0.3.5`)

**Steps**:
1. Checkout code
2. Setup pnpm and Node.js
3. Install dependencies
4. Run tests
5. Type check
6. Build
7. Publish to npm with provenance

**Required Secret**: `NPM_TOKEN`

### `release.yml` - Create GitHub Release

Creates a GitHub release with release notes when a version tag is pushed.

**Trigger**: Push tags matching `v*.*.*`

**Steps**:
1. Extract version from tag
2. Look for `docs/release-notes-{version}.md`
3. Create GitHub release with notes (or auto-generate if notes file doesn't exist)

## Setup

### 1. Create npm Access Token

1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Click "Generate New Token" → "Granular Access Token"
3. Configure:
   - **Token name**: `github-actions-vite-browser`
   - **Expiration**: 1 year (or custom)
   - **Packages and scopes**: Select `@presto1314w/vite-devtools-browser`
   - **Permissions**: Read and write
4. Copy the token (starts with `npm_...`)

### 2. Add Token to GitHub Secrets

1. Go to your GitHub repo → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Name: `NPM_TOKEN`
4. Value: Paste your npm token
5. Click "Add secret"

### 3. Enable Provenance (Optional but Recommended)

Provenance adds cryptographic proof of where your package was built. It's automatically enabled in the workflow via `--provenance` flag.

Benefits:
- Transparency: Users can verify the package source
- Security: Prevents supply chain attacks
- Trust: Shows the package was built in GitHub Actions

## Usage

### Publishing a New Version

```bash
# 1. Update version in package.json
npm version 0.3.5

# 2. Commit and push
git add package.json
git commit -m "chore: bump version to 0.3.5"
git push

# 3. Create and push tag
git tag v0.3.5
git push origin v0.3.5
```

Or use the shortcut:

```bash
# Automatically creates commit and tag
npm version 0.3.5 -m "chore: bump version to %s"
git push --follow-tags
```

### What Happens Next

1. **publish.yml** triggers:
   - Runs tests and type check
   - Builds the package
   - Publishes to npm with provenance

2. **release.yml** triggers:
   - Creates GitHub release
   - Attaches release notes from `docs/release-notes-{version}.md`

### Monitoring

- Check workflow runs: https://github.com/MapleCity1314/vite-browser/actions
- Check npm package: https://www.npmjs.com/package/@presto1314w/vite-devtools-browser

## Troubleshooting

### Publish fails with 403 Forbidden

- Check that `NPM_TOKEN` secret is set correctly
- Verify token has write permissions for the package
- Ensure token hasn't expired

### Tests fail in CI

- Run `pnpm test` locally to reproduce
- Check if dependencies are correctly specified in `package.json`
- Verify `pnpm-lock.yaml` is committed

### Build fails

- Run `pnpm build` locally
- Check TypeScript errors with `pnpm typecheck`
- Ensure all source files are committed

## Manual Publish (Fallback)

If GitHub Actions fails, you can publish manually:

```bash
# Login to npm (with 2FA)
npm login

# Publish with OTP
npm publish --access public --otp=123456
```
