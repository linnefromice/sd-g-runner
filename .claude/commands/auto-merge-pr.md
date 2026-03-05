---
description: "PR作成からCIパス確認・マージ・クリーンアップまでを一括で行う"
---

# Auto Merge PR

ローカルの変更からブランチ作成 → コミット → プッシュ → PR作成 → CI待機 → マージ → デフォルトブランチに戻るまでを一括で実行する。

## 引数

`$ARGUMENTS` が指定されていれば、PRのタイトルや説明のヒントとして使用する。

## 手順

### Phase 1: PR 作成（create-pr と同等）

#### 1-1. 変更の確認

```bash
git status
git diff --stat
```

- 変更がなければ「変更がありません」と報告して終了
- `.env`, `credentials`, `.secret` 等のセンシティブファイルが含まれていないか確認

#### 1-2. 変更の分析

- `git diff` で変更内容を把握
- 変更の種類を判定: feat / fix / refactor / docs / test / chore

#### 1-3. ブランチ作成

- ブランチ名はプロジェクト規約に従う:
  - `feature/<short-description>` — 新機能
  - `fix/<short-description>` — バグ修正
  - `refactor/<short-description>` — リファクタリング
  - `topic/<short-description>` — 複合的な変更
- 現在のブランチがデフォルトブランチ（main）であることを確認
- デフォルトブランチでなければ、そのブランチ上でそのまま作業する

```bash
git checkout -b <branch-name>
```

#### 1-4. ステージングとコミット

- 関連ファイルを個別にステージング（`git add -A` は使わない）
- `.env`, credentials, `.secret`, `.ai/`, 大きなバイナリは除外
- Conventional Commits 形式でコミットメッセージを作成

#### 1-5. プッシュ & PR 作成

```bash
git push -u origin <branch-name>
gh pr create --title "<title>" --body "<body>"
```

- `$ARGUMENTS` があればタイトル/説明に反映
- なければ変更内容から自動生成
- PR 本文に Summary と Test plan を含める

---

### Phase 2: CI 確認 & マージ（merge-pr と同等）

#### 2-1. CI 状態の確認

```bash
gh pr checks <PR番号> --watch --fail-fast
```

- **全パス**: ステップ 2-2 に進む
- **失敗あり**: 失敗した checks を報告して **停止**（マージしない）

#### 2-2. マージ

```bash
gh pr merge <PR番号> --merge
```

- マージ失敗（コンフリクト等）の場合は報告して停止

#### 2-3. デフォルトブランチに切り替え

```bash
gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name'
git checkout <default-branch>
git pull
```

#### 2-4. ローカルブランチのクリーンアップ

```bash
git branch -d <feature-branch>
```

#### 2-5. 結果報告

- マージされた PR の URL
- 現在のブランチ（デフォルトブランチ）
- クリーンアップされたブランチ

---

## CI 失敗時のフロー

CI が失敗した場合は Phase 2 で停止する。ユーザーに以下を報告:

1. 失敗した check の名前と詳細
2. PR の URL（手動で確認可能）
3. 「修正後に `/merge-pr` で手動マージできます」と案内

修正を自動で試みたりはしない。

## ルール

- CI が失敗している場合は絶対にマージしない
- マージ戦略は `--merge`（マージコミット）を使用
- force push やブランチ削除の強制（`-D`）は行わない
- デフォルトブランチへの直接プッシュは行わない
- センシティブファイルは絶対にコミットしない
- `.ai/` ディレクトリは絶対にコミットしない
- `git add -A` や `git add .` は使わない — ファイルを個別に指定
- コミットメッセージは Conventional Commits 形式
- PR タイトルは70文字以内
