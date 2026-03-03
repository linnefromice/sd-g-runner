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

## Commands

```bash
# Development
npx expo start                  # Start dev server
npx expo start --ios            # iOS simulator
npx expo start --android        # Android emulator

# Type checking & linting
npx tsc --noEmit                # TypeScript check
npx expo lint                   # ESLint

# Build
npx expo prebuild               # Generate native projects
eas build --profile development # EAS dev build
```

## Architecture (Critical)

### Three-Layer Separation

```
app/          → expo-router pages (screens, navigation)
src/engine/   → Game logic (systems, entities, collision, GameLoop) — pure TS, no React
src/rendering/→ Skia drawing (reads engine state, renders to Canvas) — no game logic
src/stores/   → Zustand stores bridging engine↔UI
src/game/     → Data definitions (forms, stages, difficulty, scoring)
src/ui/       → React Native HUD components (HP bar, EX button, combo gauge)
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

### Key Files

| File | Purpose |
|------|---------|
| `src/engine/GameLoop.ts` | `useGameLoop` hook — rAF loop calling systems with delta time |
| `src/rendering/GameCanvas.tsx` | Skia Canvas with pre-allocated entity slots reading from SharedValue |
| `src/stores/gameSessionStore.ts` | Zustand store — systems call `getState().setHp()` etc. |
| `src/ui/HUD.tsx` | React Native overlay — subscribes to Zustand via selectors |

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
- **Forms** (mecha types) are extensible via `MechaFormId` union type + `MechaFormDefinition` config objects
- **Gates** come in 4 types: `enhance`, `refit`, `tradeoff`, `recovery`
- **Boss phase** differs from normal: background slows to 0.5x, enemy/gate spawning stops, boss hovers at top
- **Combo** uses 3-segment gauge (not a number). Resets on damage/tradeoff/refit gates. 3 consecutive enhance gates → Awakened form (10s)
- **i-frame:** 1.5s invincibility after hit, with blink animation

## Performance Targets

- 60fps stable on iPhone SE 2nd gen
- 50+ simultaneous entities (bullets + enemies + effects)
- Touch input latency ≤ 33ms (2 frames)
- System update budget: ≤ 16ms per frame on JS thread

## Claude Code Configuration

`.claude/` ディレクトリに Claude Code 用の設定・ルール・エージェント定義を格納。

### Rules (`.claude/rules/`)

| ファイル                | 内容                                 |
| ----------------------- | ------------------------------------ |
| `git-workflow.md`       | コミット規約、ブランチ命名、PR手順   |
| `task-completion.md`    | タスク完了チェックリスト             |
| `agent-teams.md`        | Agent Teams 自動起動の判断基準       |
| `component-reuse.md`    | コンポーネント・モジュール共通化ルール |
| `pipeline-manifest.md`  | パイプラインマニフェスト仕様         |

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
