# Changelog

All notable changes to Project G-Runner, organized by version tag.

## [v0.5.0] — 2026-03-10

**Game Polish & Features Pack**

### Added
- **Achievement system**: 10 data-driven achievements with credit rewards, dedicated achievements screen
- **Endless mode**: Procedural wave generation with scaling difficulty (stage 99), accessible after clearing all 15 stages
- **Mini-boss enemy types**: Sentinel (shield + 3-way spread) and Carrier (spawns patrol drones)
- **Audio wiring**: SE calls at all key game events (shoot, damage, gate pass, boss appear, awaken)
- **Haptics feedback**: Vibration feedback with ON/OFF toggle in settings
- **Boss visual differentiation**: Unique Skia shapes per boss (octagon+spikes for Boss 2, diamond for Boss 3)
- **Boss entrance overlay**: Dark flash + slow-motion effect on boss spawn
- **Awakening burst**: Golden radial particles + screen shake on combo MAX
- **EX shockwave**: Visual shockwave ring on EX burst activation
- **Forced gate markers**: Pulsing opacity on forced-choice gate pairs
- **Quick restart**: Long-press on Replay button at result screen
- **Endless mode UI**: Purple "ENDLESS MODE" card in stage select, wave/survival time display
- **i18n strings**: Full EN/JA for achievements, endless mode, sentinel/carrier, haptics settings

### Fixed
- Jest mocks for `expo-av` and `expo-haptics` native modules (128 tests passing)

## [v0.4.0] — 2026-03-09

**Visual Overhaul & Form System**

### Added
- **Form XP / Skill tree**: Per-form experience tracking with 3-level skill unlocks
- **3-tier graze system**: Normal/Close/Extreme near-miss detection with escalating rewards
- **FormXPBar HUD**: XP progress display during gameplay
- **SkillChoiceOverlay**: Skill selection on level-up
- **2.5D depth scaling**: Y-position-based perspective (0.75–1.0 scale) for enemies, debris, gates
- **Grid spacing gradient**: Variable-pitch horizontal grid lines for depth perception
- **Directional shadows**: Offset shadow paths behind all entities
- **Lighting gradients**: Top-down gradient overlay for volume on entities
- **Player trail afterimage**: 3-frame motion trail with opacity decay
- **CRT scanline overlay**: Retro scan-line texture effect
- **Fake glow system**: Enlarged shape rendering with `blendMode='screen'` (replaced costly Shadow)
- **Score popup color tiers**: White → Yellow → Pink based on score value
- **Boss phase colors**: Phase-specific color shifts (red → purple → orange)
- **Spawn scale-in**: Entities grow from 0.5x to 1.0x during fade-in
- **Laser warning pulse**: Animated warning indicator before boss laser
- **Bullet stretch**: Height scaling based on bullet speed
- **Gate/EX screen flash**: Brief color flash on gate pass and EX gauge full
- **Combo max particles**: Golden particle burst at combo threshold
- **Form-specific player shapes**: Distinct SVG path per mecha form
- **Sci-Fi menu styling**: Tron-style neon UI across all menu screens

### Fixed
- Trail persistence after movement stops
- Screen shake path desync (paths rebuilt during shake)

### Performance
- Removed costly `useDerivedValues` and `Shadow` strokes from visual polish

## [v0.3.2] — 2026-03-09

**Content & Visual Polish**

### Added
- Tron-style gate portal rendering with neon borders and growth progress bar
- Centered gate labels with symmetric accent bars
- Enemy-type-specific glow colors, star color variation, grid perspective, HP bar gradient
- Tougher stage design with tradeoffs, debris, boost lanes, sine-wave bullets
- Difficulty tuning and enemy bullet pattern variety

### Performance
- Reduced Shadow count and clamped frame delta for stability

## [v0.3.1] — 2026-03-08

**Architecture Cleanup**

### Refactored
- Extracted `killBoss` utility, unified laser damage, removed scrollY interval
- Moved timers to entity layer, added collision utils, split CollisionSystem
- Added bossKill/collision tests, extracted `buildPath` helper
- Pool utility extraction, `isInvincible` unification, magic number elimination

## [v0.3.0] — 2026-03-08

**Tron-Style Visual Feedback**

### Added
- **Particle system**: Enemy kill, player hit, gate pass, EX burst, parry, boss kill particles
- **Screen shake**: Per-event intensity and duration
- **Hit stop**: Frame freeze on impactful events (enemy kill, player hit, parry, boss kill)
- **Score popups**: Floating damage numbers and bonus text
- **Tron-style entity shapes**: SVG path-based rendering for all entities
- **Dual neon glow**: Inner + outer glow per entity with Skia blendMode
- **Shockwave ring**: Visual ring on parry/EX burst
- **Bullet impact particles**: Small burst on non-kill bullet hits

### Fixed
- Reanimated array freezing issue (`.slice()` on SharedValue writes)
- Hit stop rendering and gate pass particle positioning

### Performance
- Reduced MAX_VISIBLE_ENTITIES from 256 to 128
- Moved path computation from UI thread to JS thread

## [v0.2.0] — 2026-03-07

**Phase 2: Game Systems & Content Expansion**

### Added
- **5 new stages** (6–10) with Boss 2 scaling and new timelines
- **3 enemy types**: Swarm, Phalanx (front shield), Juggernaut (heavy)
- **2 mecha forms**: Sniper (shield pierce, 2.5x ATK), Scatter (5-round spread)
- **Debris system**: Bullet-absorbing obstacles
- **Graze system**: Near-miss detection for EX/TF gauge boost
- **Boost lane system**: Score × 1.5 and scroll × 1.3 multiplier zones
- **Growth & Roulette gate variants**
- **Just TF parry**: Near-hit transform negates damage with shockwave
- **Score bonus system**: Result screen bonuses (no damage, all enemies, speed clear)
- **EX Burst beam**: Screen-clearing special attack
- **Boss laser attack**: Warning → fire sequence
- **Pierce and explosion bullet logic**
- **Android build workflow** (CI)

### Fixed
- Phase 2-A/B critical bugs and review fixes
- EX Burst gauge guard in GateSystem

## [v0.1.0] — 2026-03-06

**Initial Stable Release**

### Added
- **Core game loop**: 60fps rAF with system pipeline and Skia rendering
- **5 stages** with timeline-based enemy/gate spawning and Boss 1 encounter
- **4 mecha forms**: Standard, Heavy Artillery, High Speed, Awakened
- **Gate system**: Enhance, Recovery, Tradeoff, Refit
- **Combo & Awakening**: 3 consecutive Enhance gates → 10s powered-up form
- **Transform system**: Primary/Secondary form switching with gauge
- **HUD**: HP bar, score, combo gauge, EX button/gauge, form indicator, pause menu
- **Metagame**: Stage select, form select, upgrade shop (ATK/HP/Speed), settings
- **Save system**: AsyncStorage persistence for high scores, unlocks, credits
- **i18n**: English/Japanese with device language auto-detection
- **Audio framework**: AudioManager with expo-av (placeholder sound IDs)
- **CI/CD**: PR quality gate (lint + tsc + jest), EAS Update deploy workflow
- **How to Play** page and Gate Help overlay
- **Auto-pause** when app goes to background
