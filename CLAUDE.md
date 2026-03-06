# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Project G-Runner** — a 2D vertical-scrolling SF gate runner game (hyper-casual) built with React Native.
Full requirements: `docs/v1/REQUIREMENTS-r3.md` (v3.1, authoritative spec)

## Tech Stack

- **Framework:** Expo (Managed Workflow) with `expo-router` (file-based routing)
- **Game Loop:** Custom `useGameLoop` hook — 60fps rAF-based update loop (no RNGE dependency)
- **Rendering:** `@shopify/react-native-skia` — GPU-accelerated 2D drawing (glow, particles, neon effects)
- **Collision:** Custom AABB (no matter-js / no physics engine)
- **State:** `zustand` (game session + persistent data)
- **Sound:** `expo-av`
- **Storage:** `AsyncStorage`
- **i18n:** Custom lightweight — `expo-localization` (device language detection) + locale dictionaries (`src/i18n/`)

## Platform Support

**Native only (iOS / Android)**. Web is not supported.

This project uses `@shopify/react-native-skia` which requires native modules. **Expo Go does NOT work** — you must use a development build (`expo-dev-client`).

## Commands

```bash
# Development (requires development build installed on device/emulator)
npx expo start --dev-client     # Start dev server for dev client
npx expo start --dev-client --ios      # iOS simulator
npx expo start --dev-client --android  # Android emulator

# ⚠️ DO NOT use `npx expo start` without --dev-client (Expo Go lacks Skia support)

# Type checking & linting
npx tsc --noEmit                # TypeScript check
npx expo lint                   # ESLint

# Build
eas build --profile development --platform android  # Dev build (Android)
eas build --profile development --platform ios       # Dev build (iOS)
eas build --profile preview --platform all           # Preview build (internal distribution)

# OTA update (preview channel)
CI=1 eas update --auto --environment preview --platform ios
CI=1 eas update --auto --environment preview --platform android
```

### First-time setup

1. `npx eas login` — Log in to Expo account
2. `eas build --profile development --platform <platform>` — Create initial dev build
3. Install the built APK/IPA on your device
4. `npx expo start --dev-client` — Start dev server

## Architecture (Critical)

### Three-Layer Separation

```
app/            → expo-router pages (screens, navigation)
src/engine/     → Game logic (systems, entities, collision, GameLoop) — pure TS, no React
src/rendering/  → Skia drawing (reads engine state, renders to Canvas) — no game logic
src/stores/     → Zustand stores bridging engine↔UI
src/game/       → Data definitions (forms, stages, difficulty, scoring, upgrades)
src/ui/         → React Native HUD components (HP bar, EX button, combo gauge)
src/i18n/       → Internationalization — locale dictionaries, useTranslation hook
src/audio/      → Sound management (BGM, SE via expo-av)
src/constants/  → Shared constants (balance values, colors, dimensions)
src/types/      → TypeScript type definitions (entities, forms, gates, stages)
```

### Game Loop + Skia Integration (MUST follow)

**Entity coordinates must NEVER use `useState`/`setState`.** This causes 60fps re-render storms.

The correct pattern:
1. `useGameLoop` systems mutate `entities` (plain JS objects in a `useRef`) directly each frame
2. A sync system copies entity positions to a Reanimated `SharedValue` each frame
3. Skia `GameCanvas` reads from `SharedValue` via `useDerivedValue` — bypasses React render cycle
4. Only HUD elements (HP, score, EX gauge) use Zustand/React state — event-driven updates only

```
Game Loop Systems → entities (plain object mutation) → SharedValue sync → Skia useDerivedValue reads & draws
                                                     → Zustand setState (event-driven, for HUD only)
```

**Banned:** Individual React components per entity (`<Enemy />` × 100). All entities draw on a single Skia Canvas via pre-allocated slots.

### Reanimated + RNGH Safety (CRITICAL)

RNGH v2 gesture callbacks run as **Reanimated worklets** by default when Reanimated is installed. Worklets serialize captured JS values, and **Reanimated 4.x freezes these objects (read-only)**. This will silently kill the game loop if entity refs are captured.

**Mandatory pattern** — all gesture handlers that access `entitiesRef`:

```typescript
// ✅ MUST: .runOnJS(true) keeps callback on JS thread
const pan = Gesture.Pan().runOnJS(true).onUpdate((e) => {
  entitiesRef.current.player.x = e.absoluteX / scale;
});

// ❌ FATAL: Without runOnJS, entities get frozen → game halts
const pan = Gesture.Pan().onUpdate((e) => {
  entitiesRef.current.player.x = e.absoluteX / scale; // will throw or silently freeze
});
```

**SharedValue flow is one-way only:** Systems write → `renderData.value = ...` → Skia reads. Never pass mutable entity objects into SharedValue or worklet closures.

### Key Files

| File | Purpose |
|------|---------|
| `src/engine/GameLoop.ts` | `useGameLoop` hook — rAF loop calling systems with delta time |
| `src/engine/systems/GameOverSystem.ts` | Game over (HP=0) and stage completion (time-based or boss defeat) |
| `src/rendering/GameCanvas.tsx` | Skia Canvas with pre-allocated entity slots reading from SharedValue |
| `src/stores/gameSessionStore.ts` | Zustand store — systems call `getState().setHp()` etc. |
| `src/ui/HUD.tsx` | React Native overlay — HP, score, combo, EX gauge, stage progress bar |
| `src/ui/PauseMenu.tsx` | Pause overlay — Resume / Exit Stage buttons |
| `src/i18n/index.ts` | i18n core — `useTranslation()` hook, `resolveLocale()`, `getTranslation()` |
| `src/i18n/locales/en.ts` | English dictionary + `Translations` type (auto-derived via `Widen<T>`) |
| `src/constants/balance.ts` | Game balance constants (combo threshold, gauge max, spawn rates, etc.) |
| `app/game/[stageId]/index.tsx` | Main game screen — gesture handling, system registration, HUD wiring |
| `app/stages/[id]/select-form.tsx` | Form selection screen — Primary/Secondary two-step selection |
| `app/settings.tsx` | Settings screen — BGM/SE volume, language selector |

### Coordinate System

Logical coordinates: X `0–320` (fixed width), Y dynamic based on aspect ratio.
Scale: `screenWidth / 320`. Player hitbox (16×16) is smaller than visual (32×40).

### State Architecture

| Layer | Storage | Purpose |
|-------|---------|---------|
| Game entities | useRef plain JS objects | Positions, bullets, enemies — mutated by systems |
| Session UI | Zustand `gameSessionStore` | HP display, score, combo, EX gauge — React-connected |
| Persistent | Zustand `saveDataStore` + AsyncStorage | High scores, unlocks, credits, upgrades |

Systems bridge game→UI: e.g., `CollisionSystem` calls `gameSessionStore.getState().setHp(newHp)`.

## Game-Specific Conventions

- **Stages** are data-driven: timeline-based JSON definitions in `src/game/stages/`
- **Stage completion**: Non-boss stages complete when `stageTime >= duration`. Boss stages complete when `boss.hp <= 0`. Both checked in `GameOverSystem`.
- **Forms** (mecha types) are extensible via `MechaFormId` union type + `MechaFormDefinition` config objects
- **Gates** come in 4 types: `enhance`, `refit`, `tradeoff`, `recovery`
- **Boss phase** differs from normal: background slows to 0.5x, enemy/gate spawning stops, boss hovers at top
- **Combo** uses 3-segment gauge (not a number). Resets on damage/tradeoff/refit gates. 3 consecutive enhance gates → Awakened form (10s)
- **i-frame:** 1.5s invincibility after hit, with blink animation
- **Player input**: Pan/drag moves player directly (1:1 follow). Tap sets a target — `MovementSystem` smoothly slides the player there at `PLAYER_MOVE_SPEED`. Gesture callbacks MUST use `.runOnJS(true)`.
- **Pause menu**: Pause button opens `PauseMenu` overlay (Resume / Exit Stage). Game loop stops and `isPaused` is set in store.
- **Transform system**: Transform gauge builds over time / enemy kills / gate passes. When full, TF button switches between Primary and Secondary forms. Refit gates override this.
- **i18n**: `en` dictionary uses `as const` + `Widen<T>` to auto-derive `Translations` type. `ja` dictionary typed as `Translations`. HowToPlay content is in separate files (`src/i18n/content/`). New keys must be added to both dictionaries — CI runs key sync test. `MechaFormId` values are used directly as `t.forms` keys (no indirection layer).

## Performance Targets

- 60fps stable on iPhone SE 2nd gen
- 50+ simultaneous entities (bullets + enemies + effects)
- Touch input latency ≤ 33ms (2 frames)
- System update budget: ≤ 16ms per frame on JS thread

## Claude Code Configuration

`.claude/` ディレクトリに Claude Code 用の設定・ルール・エージェント定義を格納。

### Rules (`.claude/rules/`)

| ファイル                  | 内容                                       |
| ------------------------- | ------------------------------------------ |
| `git-workflow.md`         | コミット規約、ブランチ命名、PR手順         |
| `task-completion.md`      | タスク完了チェックリスト                   |
| `agent-teams.md`          | Agent Teams 自動起動の判断基準             |
| `component-reuse.md`      | コンポーネント・モジュール共通化ルール     |
| `pipeline-manifest.md`    | パイプラインマニフェスト仕様               |
| `reanimated-safety.md`    | Reanimated + RNGH ワークレット安全パターン |

### Agents (`.claude/agents/`)

| エージェント               | 用途                                         |
| -------------------------- | -------------------------------------------- |
| `code-reviewer`            | コード品質・パフォーマンスレビュー           |
| `planner`                  | 実装計画の作成                               |
| `qa-specialist`            | テスト戦略・品質保証                         |
| `refactor-cleaner`         | デッドコード検出・クリーンアップ             |
| `documentation-maintainer` | ドキュメント整合性維持                       |
| `technical-architect`      | ゲームアーキテクチャ・システム設計           |

## Agent Team Operational Rules

複雑なタスクでは Agent Teams が自動的に組成されます。
詳細は `.claude/rules/agent-teams.md` を参照してください。

### Teammate の行動規範

- **能動的な取得**: 共有タスクリストから能動的に未着手タスクを claim すること
- **即時通信**: 共通インターフェースに影響が出る変更は、即座に関連 Teammate にメッセージを送ること
- **品質ゲート**: テストを実行せずにタスクを Complete とマークしないこと
- **コンテキスト共有**: 発見した重要な情報は他の Teammate と共有すること
