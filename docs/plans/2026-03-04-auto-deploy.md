# Auto-Deploy Infrastructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up CI (lint + tsc + jest on PRs) and CD (EAS Update OTA on main merge) via GitHub Actions.

**Architecture:** Two GitHub Actions workflows — `ci.yml` gates PRs with quality checks, `deploy.yml` publishes OTA updates to the `preview` channel on main push. EAS project config (`eas.json`) defines build profiles and channels.

**Tech Stack:** GitHub Actions, EAS CLI, expo-github-action@v8, Expo SDK 55

---

## Pre-requisites (manual, outside this plan)

Before running the deploy workflow, the developer must:
1. Run `npx eas login` to authenticate with Expo
2. Run `npx eas build:configure` (this plan creates `eas.json` manually, so skip if already present)
3. Run `npx eas build --profile preview --platform all` to create the initial base binary
4. Add `EXPO_TOKEN` to GitHub repo Settings → Secrets and variables → Actions

---

### Task 1: Create `eas.json`

**Files:**
- Create: `eas.json`

**Step 1: Create the EAS configuration file**

```json
{
  "cli": {
    "version": ">= 16.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development"
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "channel": "production",
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

Write this to `eas.json` at project root.

**Step 2: Add `expo-updates` dependency**

EAS Update requires the `expo-updates` package. Run:

```bash
npx expo install expo-updates
```

**Step 3: Update `app.json` to include updates config**

Add the `updates` and `runtimeVersion` fields to `app.json` under the `"expo"` key:

```json
{
  "expo": {
    ...existing fields...,
    "runtimeVersion": {
      "policy": "appVersion"
    },
    "updates": {
      "url": "https://u.expo.dev/<projectId>"
    }
  }
}
```

Note: The `<projectId>` will be populated after `eas update:configure` or can be found in the Expo dashboard. For now, use a placeholder — the deploy workflow will handle this automatically via `eas update --auto`.

Actually, simpler approach: run `eas update:configure` which auto-adds the correct fields. But since we may not have EAS CLI in CI yet, we'll add the `runtimeVersion` manually and let EAS handle the rest.

Add only the `runtimeVersion` to `app.json`:

```json
"runtimeVersion": {
  "policy": "appVersion"
}
```

And add `"expo-updates"` to the plugins array.

**Step 4: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: Pass (no errors)

**Step 5: Commit**

```bash
git add eas.json app.json package.json package-lock.json
git commit -m "chore: Add EAS config with build profiles and update channels"
```

---

### Task 2: Create CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Create the workflow file**

```yaml
name: CI

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  quality:
    name: Lint, Type Check & Test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npx expo lint

      - name: Type check
        run: npx tsc --noEmit

      - name: Test
        run: npx jest --passWithNoTests
```

Write this to `.github/workflows/ci.yml`.

**Step 2: Verify YAML syntax**

Run: `cat .github/workflows/ci.yml | python3 -c "import sys,yaml; yaml.safe_load(sys.stdin)" && echo "YAML valid"`
Expected: "YAML valid"

**Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: Add PR quality gate workflow (lint + tsc + jest)"
```

---

### Task 3: Create Deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`

**Step 1: Create the workflow file**

```yaml
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  update:
    name: EAS Update
    runs-on: ubuntu-latest
    steps:
      - name: Check for EXPO_TOKEN
        run: |
          if [ -z "${{ secrets.EXPO_TOKEN }}" ]; then
            echo "EXPO_TOKEN secret is not set. Skipping deploy."
            echo "Add it in GitHub repo Settings → Secrets and variables → Actions"
            exit 1
          fi

      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          packager: npm
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Install dependencies
        run: npm ci

      - name: Publish update
        run: eas update --auto --non-interactive
```

Write this to `.github/workflows/deploy.yml`.

**Step 2: Verify YAML syntax**

Run: `cat .github/workflows/deploy.yml | python3 -c "import sys,yaml; yaml.safe_load(sys.stdin)" && echo "YAML valid"`
Expected: "YAML valid"

**Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: Add EAS Update deploy workflow on main push"
```

---

### Task 4: Fix pre-existing lint issue

**Context:** `npx expo lint` currently fails due to the `@shopify/react-native-skia` config plugin error. This will block the CI workflow. We need to either fix it or work around it.

**Step 1: Investigate the lint error**

Run: `npx expo lint 2>&1 | head -30`

Observe the error. If it's the Skia config plugin issue, it's a known problem with the expo-lint integration trying to load config plugins.

**Step 2: Fix or configure ESLint to bypass the issue**

If the error is from Expo's config plugin resolution (not an actual lint error), check if adding an `.eslintignore` or adjusting the ESLint config resolves it.

Alternatively, if the error is in the Expo CLI itself (not ESLint), update the CI workflow to use `npx eslint .` directly instead of `npx expo lint`.

Run: `npx eslint . 2>&1 | head -30`

If this passes, update `.github/workflows/ci.yml` lint step from `npx expo lint` to `npx eslint .`.

**Step 3: Verify the fix**

Run the chosen lint command and confirm it passes.

**Step 4: Commit if changes were needed**

```bash
git add -A
git commit -m "fix: Resolve lint configuration for CI compatibility"
```

---

### Task 5: Verify full CI pipeline locally

**Step 1: Run the full CI check sequence**

```bash
npx expo lint && npx tsc --noEmit && npx jest --passWithNoTests
```

Or if using direct eslint:

```bash
npx eslint . && npx tsc --noEmit && npx jest --passWithNoTests
```

Expected: All three pass.

**Step 2: Create PR to verify CI workflow**

This should be done as part of the overall branch push. The CI workflow will trigger on PR creation.

---

### Task 6: Push branch and create PR

**Step 1: Push the feature branch**

```bash
git push -u origin <branch-name>
```

**Step 2: Create PR**

```bash
gh pr create --title "chore: Add CI/CD pipeline (GitHub Actions + EAS Update)" --body "$(cat <<'EOF'
## Summary
- Add `eas.json` with development/preview/production build profiles and channels
- Add CI workflow: lint + type check + tests on PRs
- Add Deploy workflow: EAS Update OTA publish on main merge
- Install `expo-updates` dependency for OTA support

## Pre-requisites (manual)
- [ ] `npx eas login` — authenticate with Expo
- [ ] `npx eas build --profile preview --platform all` — create initial base binary
- [ ] Add `EXPO_TOKEN` to GitHub Secrets

## Test plan
- [ ] CI workflow triggers on this PR and passes
- [ ] After merge, deploy workflow triggers (will skip if EXPO_TOKEN not set)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Step 3: Verify CI runs on the PR**

Check: `gh pr checks <PR-number>`
Expected: CI workflow triggers and runs.
