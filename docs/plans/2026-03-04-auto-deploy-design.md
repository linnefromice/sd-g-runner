# 自動デプロイ基盤 設計ドキュメント

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** main マージ時に EAS Update で OTA 配信する CI/CD パイプラインを構築する

**Approach:** EAS Update 単体 + GitHub Actions CI（アプローチ A）

---

## 背景

Phase 1 コアメカニクスが完了し（PR #2）、以降の開発サイクルを支える基盤整備が必要。
現状は CI も CD も一切なく、コード品質ゲートもデプロイ自動化もない。

## 要件

- **CI ゲート**: PR 時に lint + tsc + jest を実行し、失敗で PR をブロック
- **自動デプロイ**: main マージ時に EAS Update で preview チャネルへ OTA 配信
- **プラットフォーム**: iOS + Android
- **トリガー**: main ブランチへの push

## 全体アーキテクチャ

```
PR 作成/更新 ──→ [CI Workflow] lint + tsc + jest ──→ ✅/❌ ステータス

main マージ ──→ [Deploy Workflow] eas update ──→ preview チャネルに OTA 配信
                    (iOS + Android)
```

## ファイル構成

| ファイル | 目的 |
|----------|------|
| `eas.json` | EAS プロジェクト設定（build profiles + update channel 定義） |
| `.github/workflows/ci.yml` | PR ゲート — lint, tsc, jest |
| `.github/workflows/deploy.yml` | main push 時 — EAS Update 実行 |

## 詳細設計

### 1. `eas.json`

3 つのビルドプロファイル:

| Profile | Channel | Distribution | 用途 |
|---------|---------|-------------|------|
| `development` | `development` | internal | 開発用 dev client |
| `preview` | `preview` | internal | テスト配信。EAS Update の配信先 |
| `production` | `production` | store | ストア提出（将来用） |

### 2. CI Workflow (`ci.yml`)

- **トリガー**: `pull_request` (opened, synchronize)
- **ランナー**: `ubuntu-latest`
- **ステップ**:
  1. `actions/checkout@v4`
  2. `actions/setup-node@v4` (Node.js 20)
  3. `npm ci`
  4. `npx expo lint`
  5. `npx tsc --noEmit`
  6. `npx jest --passWithNoTests`

### 3. Deploy Workflow (`deploy.yml`)

- **トリガー**: `push` to `main`
- **ランナー**: `ubuntu-latest`
- **シークレット**: `EXPO_TOKEN`
- **ステップ**:
  1. `actions/checkout@v4`
  2. `actions/setup-node@v4` (Node.js 20)
  3. `npm ci`
  4. `expo-github-action` (EAS CLI セットアップ + 認証)
  5. `eas update --auto --non-interactive`

### 4. 手動前提条件（1回のみ）

1. `npx eas login` で Expo アカウントにログイン
2. `npx eas build:configure` で eas.json 生成
3. `npx eas build --profile preview --platform all` で初回ベースバイナリ作成
4. GitHub リポジトリ Settings → Secrets に `EXPO_TOKEN` を登録

## 将来の拡張パス

- **PR プレビュー**: PR 時にも preview チャネルの別ブランチに EAS Update → QR コード付きコメント
- **EAS Build 自動化**: ネイティブ依存変更時のみ EAS Build をトリガー
- **EAS Submit**: production ビルド → App Store / Google Play への自動提出

## 決定事項

| 項目 | 決定 |
|------|------|
| デプロイ方式 | EAS Update (OTA) |
| トリガー | main push |
| CI ゲート | lint + tsc + jest on PR |
| プラットフォーム | iOS + Android |
| EAS Build 自動化 | スコープ外（手動で初回のみ） |
