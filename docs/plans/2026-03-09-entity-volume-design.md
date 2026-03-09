# Entity Volume (Shadow + Gradient) Design

**Goal:** ディレクショナル・シャドウと固定方向グラデーションで、フラットなエンティティに立体感（浮遊感＋ボリューム）を追加する。

**Architecture:** Shadow Path は glowPath と同じパターンで SyncRenderSystem で事前計算。グラデーションは固定方向（上→下）の半透明オーバーレイとして EntitySlot に追加。useDerivedValue 追加は最小限（+1/slot）に抑える。

**Tech Stack:** @shopify/react-native-skia (Path, LinearGradient, vec), react-native-reanimated SharedValue

---

## 1. Directional Shadow (Shadow Path)

エンティティの背面に、右下にオフセットした同一形状の黒半透明パスを描画。

### 計算

```
shadowX = x + SHADOW_OFFSET_X
shadowY = y + SHADOW_OFFSET_Y
shadowPath = buildPath(type, shadowX, shadowY, width, height, scale)
shadowColor = '#00000040'  (黒, 25% opacity)
```

- `SHADOW_OFFSET_X = 3` (論理座標, 右方向)
- `SHADOW_OFFSET_Y = 5` (論理座標, 下方向)

### 適用対象

| エンティティ | Shadow 適用 | 理由 |
|-------------|------------|------|
| player | Yes | 浮遊感を出す主役 |
| enemies | Yes | 空間内の存在感 |
| boss | Yes | 巨大感の強調（オフセット大） |
| debris | Yes | 浮遊オブジェクト |
| playerBullet | No | 小さすぎて影が見えない、発光体 |
| enemyBullet | No | 同上 |
| gates | No | 背景要素、影は不自然 |
| particles | No | エフェクト、影不要 |

### 描画順序

```
shadowPath → glowPath → mainPath → (stroke/rect/gate/HP bar)
```

### RenderEntity フィールド追加

```typescript
shadowPath?: string;  // 事前計算済みの影パス（スクリーン座標）
```

`shadowColor` は全エンティティ共通なので定数化（RenderEntity に含めない）。

---

## 2. Fixed-Direction LinearGradient Overlay

メインパスの上に、固定方向（上→下）の半透明グラデーションを重ねて立体感を付与。

### 仕組み

```tsx
<Path path={pathStr} opacity={fillOpacity}>
  <LinearGradient
    start={vec(0, 0)}
    end={vec(0, screenHeight)}
    colors={['#FFFFFF15', '#00000030']}  // 上: 白15% → 下: 黒19%
  />
</Path>
```

- **固定方向**: 上→下（全エンティティ共通、光源が上にある想定）
- **固定色**: 半透明白→半透明黒（色味に影響しない）
- **スクリーン全体座標**: `start=vec(0,0)` `end=vec(0, screenHeight)` で画面上部ほど明るく

### useDerivedValue 追加: 0個

`start/end/colors` は全て定数のため、useDerivedValue 不要。`screenHeight` は EntitySlot の外で一度だけ計算し prop として渡す。

### 適用対象

Shadow Path と同じエンティティに適用（player, enemies, boss, debris）。

---

## 変更ファイル一覧

| ファイル | 変更内容 |
|---------|---------|
| `src/constants/balance.ts` | `SHADOW_OFFSET_X`, `SHADOW_OFFSET_Y`, `SHADOW_COLOR` 追加 |
| `src/types/rendering.ts` | `shadowPath?: string` 追加 |
| `src/engine/systems/SyncRenderSystem.ts` | `buildShadowPath` ヘルパー + 対象エンティティに適用 |
| `src/rendering/GameCanvas.tsx` | EntitySlot に shadowPath 描画 + LinearGradient オーバーレイ追加 |

## パフォーマンス影響

- shadowPath 計算: buildPath と同等（entity あたり文字列生成 1 回）
- 新規 useDerivedValue: +1/slot（shadowPathStr）
- 新規 Skia ノード: +1 Path（shadow）+ 1 LinearGradient（gradient overlay, Path の子）
- LinearGradient: GPU シェーダー補間、Shadow blur の 1/100 程度のコスト
