# ローカルAI搭載カンバンタスク管理アプリ - 実装計画

**作成日**: 2026-03-04
**仕様書バージョン**: 1.0
**ステータス**: 計画策定中

---

## 1. 全体像と成功基準

### ゴール
ローカル環境で完結するAI搭載カンバン式タスク管理デスクトップアプリ（Tauri v2）を構築する。

### 成功基準
- [ ] Tauri v2デスクトップアプリとして起動・動作する
- [ ] プロジェクトの作成・一覧表示・削除ができる
- [ ] カンバンボード上でタスクのCRUD + ドラッグ&ドロップができる
- [ ] AIチャット（Ollama/Qwen2.5:7b）で自然言語によるタスク操作ができる
- [ ] Jira連携（チケット表示・新規作成）ができる
- [ ] 全機能がローカル完結で動作する

---

## 2. 技術スタック詳細

| レイヤー | 技術 | バージョン/備考 |
|---|---|---|
| デスクトップシェル | Tauri v2 | `npm create tauri-app@latest` |
| フロントエンド | React + TypeScript + Vite | |
| バックエンド | Rust | Tauri v2の`lib.rs`にロジック集約 |
| DB | SQLite | `sqlx 0.8` + `runtime-tokio` + `sqlite` |
| LLM | Ollama (Qwen2.5:7b) | `tauri-plugin-shell`でsidecar起動 |
| HTTP Client | reqwest | Jira API + Ollama API呼び出し |
| カンバンDnD | @dnd-kit/core + @dnd-kit/sortable | |
| UI | Tailwind CSS | シンプルで統一感のあるUI |

### Rustクレート依存関係

```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-shell = "2"
sqlx = { version = "0.8", features = ["runtime-tokio", "sqlite"] }
tokio = { version = "1", features = ["full"] }
reqwest = { version = "0.12", features = ["json"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
chrono = { version = "0.4", features = ["serde"] }
```

### フロントエンド依存関係

```json
{
  "@tauri-apps/api": "^2",
  "@tauri-apps/plugin-shell": "^2",
  "@dnd-kit/core": "^6",
  "@dnd-kit/sortable": "^8",
  "@dnd-kit/utilities": "^3",
  "react": "^19",
  "react-dom": "^19",
  "react-router-dom": "^7",
  "tailwindcss": "^4"
}
```

---

## 3. ディレクトリ構成

```
kaito/
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── index.html
├── src/                          # フロントエンド
│   ├── main.tsx
│   ├── App.tsx
│   ├── router.tsx                # ルーティング定義
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppLayout.tsx
│   │   ├── projects/
│   │   │   ├── ProjectList.tsx
│   │   │   └── ProjectCard.tsx
│   │   ├── board/
│   │   │   ├── KanbanBoard.tsx
│   │   │   ├── Column.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   └── TaskDetailModal.tsx
│   │   ├── chat/
│   │   │   ├── ChatPanel.tsx
│   │   │   └── ChatMessage.tsx
│   │   ├── jira/
│   │   │   ├── JiraBoard.tsx
│   │   │   └── JiraTicketCard.tsx
│   │   └── settings/
│   │       └── JiraSettings.tsx
│   ├── hooks/
│   │   ├── useProjects.ts
│   │   ├── useTasks.ts
│   │   ├── useColumns.ts
│   │   ├── useChat.ts
│   │   └── useJira.ts
│   ├── lib/
│   │   ├── tauri.ts              # Tauri invoke ラッパー
│   │   └── types.ts              # 共有型定義
│   └── assets/
└── src-tauri/                    # バックエンド
    ├── Cargo.toml
    ├── tauri.conf.json
    ├── capabilities/
    │   └── default.json
    ├── migrations/
    │   └── 001_initial.sql       # DBスキーマ
    └── src/
        ├── main.rs               # エントリーポイント（変更しない）
        ├── lib.rs                 # Tauriセットアップ + コマンド登録
        ├── db.rs                  # DB接続・初期化
        ├── commands/
        │   ├── mod.rs
        │   ├── projects.rs       # プロジェクトCRUD
        │   ├── columns.rs        # カラムCRUD
        │   ├── tasks.rs          # タスクCRUD + 採番
        │   ├── tags.rs           # タグ管理
        │   ├── checklists.rs     # チェックリスト
        │   ├── chat.rs           # AIチャット処理
        │   └── jira.rs           # Jira API連携
        ├── models/
        │   ├── mod.rs
        │   ├── project.rs
        │   ├── column.rs
        │   ├── task.rs
        │   ├── tag.rs
        │   ├── checklist.rs
        │   └── chat.rs
        ├── ollama/
        │   ├── mod.rs
        │   ├── client.rs         # Ollama HTTP API クライアント
        │   ├── prompt.rs         # システムプロンプト定義
        │   └── parser.rs         # JSON応答パーサー
        └── jira/
            ├── mod.rs
            ├── client.rs         # Jira REST API クライアント
            └── types.rs          # Jira型定義
```

---

## 4. フェーズ別実装計画

### Phase 1: 基盤構築（変更ファイル: 約15ファイル）

**目標**: Tauri v2プロジェクトのセットアップ、DB初期化、プロジェクト一覧画面

#### サブタスク

| # | タスク | 主要ファイル | 見積り |
|---|--------|-------------|--------|
| 1-1 | Tauri v2 + React + TypeScript プロジェクト作成 | プロジェクトルート全体 | 中 |
| 1-2 | Tailwind CSS セットアップ | tailwind.config.ts, index.css | 小 |
| 1-3 | Rust依存関係追加（sqlx, tokio, serde, reqwest, chrono） | Cargo.toml | 小 |
| 1-4 | SQLiteマイグレーション作成（全テーブル） | migrations/001_initial.sql | 小 |
| 1-5 | DB接続・初期化モジュール | src-tauri/src/db.rs, lib.rs | 中 |
| 1-6 | Rustモデル定義（Project, Column, Task, Tag等） | src-tauri/src/models/*.rs | 中 |
| 1-7 | プロジェクトCRUD Tauriコマンド | src-tauri/src/commands/projects.rs | 中 |
| 1-8 | React Router セットアップ | src/router.tsx, App.tsx | 小 |
| 1-9 | プロジェクト一覧画面UI | src/components/projects/*.tsx | 中 |
| 1-10 | プロジェクト作成・削除機能 | hooks/useProjects.ts, lib/tauri.ts | 中 |

#### 成果物
- 起動可能なTauriアプリ
- プロジェクトの作成・一覧・削除

---

### Phase 2: カンバンコア（変更ファイル: 約12ファイル）

**目標**: カンバンボードの完全実装（カラム・タスクCRUD + DnD）

#### サブタスク

| # | タスク | 主要ファイル | 見積り |
|---|--------|-------------|--------|
| 2-1 | カラムCRUD Tauriコマンド | commands/columns.rs | 中 |
| 2-2 | タスクCRUD + task_number採番ロジック | commands/tasks.rs | 中 |
| 2-3 | タグCRUD Tauriコマンド | commands/tags.rs | 小 |
| 2-4 | チェックリストCRUD Tauriコマンド | commands/checklists.rs | 小 |
| 2-5 | カンバンボードUI（Column + TaskCard） | components/board/*.tsx | 大 |
| 2-6 | dnd-kit統合（カラム間タスク移動） | KanbanBoard.tsx, hooks/useTasks.ts | 大 |
| 2-7 | タスク詳細モーダル（編集・タグ・チェックリスト） | TaskDetailModal.tsx | 中 |
| 2-8 | カラム追加・削除・並び替えUI | Column.tsx, hooks/useColumns.ts | 中 |
| 2-9 | プロジェクト作成時デフォルトカラム自動生成 | commands/projects.rs修正 | 小 |

#### 成果物
- 完全なカンバンボード（DnD対応）
- タスクの全CRUD操作
- タグ・チェックリスト管理

---

### Phase 3: AIチャット（変更ファイル: 約10ファイル）

**目標**: Ollama連携AIチャットによるタスク操作

#### サブタスク

| # | タスク | 主要ファイル | 見積り |
|---|--------|-------------|--------|
| 3-1 | Ollama HTTPクライアント（/api/chat） | ollama/client.rs | 中 |
| 3-2 | システムプロンプト設計（アクション定義 + Few-shot） | ollama/prompt.rs | 大 |
| 3-3 | AI応答JSONパーサー（actions配列解釈） | ollama/parser.rs | 中 |
| 3-4 | チャットTauriコマンド（送信→パース→タスク操作） | commands/chat.rs | 大 |
| 3-5 | チャット履歴DB保存・取得 | commands/chat.rs, models/chat.rs | 小 |
| 3-6 | Ollama起動確認・自動起動（sidecar） | lib.rs, capabilities/default.json | 中 |
| 3-7 | チャットUI実装 | components/chat/*.tsx | 中 |
| 3-8 | チャット→ボード連動（リアルタイム反映） | hooks/useChat.ts | 中 |
| 3-9 | 会話履歴トリミング（直近20件） | ollama/client.rs | 小 |

#### 成果物
- AIチャットでタスク作成・更新・移動・完了
- `#番号`指定での操作
- Ollama自動起動・フォールバック

---

### Phase 4: Jira連携（変更ファイル: 約10ファイル）

**目標**: Jiraスペースのタブ表示 + チケット閲覧・新規作成

#### サブタスク

| # | タスク | 主要ファイル | 見積り |
|---|--------|-------------|--------|
| 4-1 | Jira REST APIクライアント（認証・一覧取得・作成） | jira/client.rs, types.rs | 大 |
| 4-2 | Jiraスペース設定CRUD Tauriコマンド | commands/jira.rs | 中 |
| 4-3 | アクセストークン暗号化保存 | commands/jira.rs, db.rs | 中 |
| 4-4 | Jira設定画面UI | components/settings/JiraSettings.tsx | 中 |
| 4-5 | タブUI（ローカル / Jiraスペース切り替え） | components/board/KanbanBoard.tsx修正 | 中 |
| 4-6 | Jiraチケットボード表示（カンバン形式） | components/jira/*.tsx | 中 |
| 4-7 | Jira新規チケット作成機能 | components/jira/*, commands/jira.rs | 中 |
| 4-8 | 30秒キャッシュ実装 | jira/client.rs | 小 |
| 4-9 | AIからのJira操作対応 | ollama/prompt.rs, commands/chat.rs修正 | 中 |

#### 成果物
- Jiraスペースのタブ管理
- チケット一覧表示・新規作成
- AIからのJiraチケット作成

---

### Phase 5: 仕上げ（変更ファイル: 約8ファイル）

**目標**: エラーハンドリング・UX改善・パフォーマンス調整

#### サブタスク

| # | タスク | 主要ファイル | 見積り |
|---|--------|-------------|--------|
| 5-1 | エラーハンドリング統一（Rust側Result型） | commands/*.rs | 中 |
| 5-2 | フロントエンドエラー表示（トースト通知） | components/layout/ | 中 |
| 5-3 | Ollamaモデル未インストール時のガイドUI | components/chat/ChatPanel.tsx | 小 |
| 5-4 | UI磨き込み（レスポンシブ、アニメーション） | components/**/*.tsx | 中 |
| 5-5 | パフォーマンス最適化（仮想スクロール等） | components/board/*.tsx | 中 |
| 5-6 | アプリアイコン・タイトル設定 | tauri.conf.json, icons/ | 小 |

#### 成果物
- 完成品質のデスクトップアプリ

---

## 5. 実行パターン判定

### 分析

| 項目 | 値 |
|---|---|
| 総変更ファイル数 | 約55ファイル（新規作成含む） |
| フェーズ数 | 5フェーズ |
| 並列可能性 | フェーズ内でRust/React並列可能 |
| 機能独立性 | 各フェーズは順序依存あり |

### 判定: フェーズ単位でパターンBを適用

各フェーズの実行は **パターンB（tmux並列）** が最適。
- Rust側（コマンド・モデル）とReact側（UI・hooks）を並列で開発可能
- フェーズ間は順序依存があるため、フェーズ単位で順次実行

ただし今回は**計画策定のみ**のため、パターン選択は実装開始時に確定する。

---

## 6. 技術的意思決定

| 決定事項 | 選択 | 理由 |
|---|---|---|
| DB操作 | sqlx直接利用（Rust側） | 仕様のDBスキーマが複雑（JOIN、採番ロジック等）。tauri-plugin-sqlでは不十分 |
| Ollama通信 | reqwestでHTTP API直接呼び出し | sidecarは起動のみ。API通信はRust側で制御 |
| フロントエンドルーティング | react-router-dom v7 | プロジェクト一覧⇔ボード画面の遷移に必要 |
| CSS | Tailwind CSS v4 | 高速なUI構築、一貫したデザイン |
| 状態管理 | React hooks（useState/useEffect） | 複雑なグローバル状態は不要。Tauri commandが状態の真実の源 |
| トークン暗号化 | Rust側でAES-256-GCM | Jiraトークンのローカル暗号化保存 |

---

## 7. リスクと対策

| リスク | 影響度 | 対策 |
|---|---|---|
| Ollama sidecarがOS依存で動作しない | 高 | sidecar非使用フォールバック：システムOllamaの直接検出 |
| Qwen2.5:7bのJSON出力精度 | 高 | Few-shotプロンプト + JSON Schema指定 + リトライロジック |
| sqlxコンパイル時チェックのDB不在 | 中 | `sqlx::query!`ではなく`sqlx::query_as`を使用（ランタイムチェック） |
| dnd-kitのパフォーマンス（大量タスク） | 中 | 仮想スクロール導入（Phase 5） |
| Jira APIのレート制限 | 低 | 30秒キャッシュ + エラーハンドリング |

---

## 8. DBスキーマ（仕様書準拠）

仕様書Section 9のスキーマをそのまま採用。追加事項:
- `tasks.position` カラムを追加（カラム内の並び順制御用）
- `columns` テーブルにON DELETE CASCADEを追加
- インデックス追加（検索パフォーマンス用）

```sql
-- 追加インデックス
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_column_id ON tasks(column_id);
CREATE INDEX idx_columns_project_id ON columns(project_id);
CREATE INDEX idx_task_tags_task_id ON task_tags(task_id);
CREATE INDEX idx_checklists_task_id ON checklists(task_id);
CREATE INDEX idx_chat_messages_project_id ON chat_messages(project_id);
```

---

## 9. AIプロンプト設計概要

### システムプロンプト（要点）

```
あなたはカンバンタスク管理アシスタントです。
ユーザーの日本語指示を解析し、以下のJSON形式でアクションを返してください。

利用可能なアクション:
- create_task: タスク作成（title必須、priority/due_date/tags任意）
- update_task: タスク更新（task_number必須、fieldsで更新内容指定）
- move_task: タスク移動（task_number必須、column名指定）
- delete_task: タスク削除（task_number必須）
- create_jira_ticket: Jiraチケット作成（title必須、description任意）
- search_jira: Jira検索（query必須）

応答フォーマット:
{"actions": [...], "message": "ユーザーへの応答メッセージ"}

例: ユーザー「#3を完了にして」
→ {"actions": [{"type": "move_task", "task_number": 3, "column": "Done"}], "message": "#3を「Done」に移動しました。"}
```

---

## 10. 実装開始手順

1. `npm create tauri-app@latest` でプロジェクト雛形を生成
2. 既存のkaito設定ファイル（CLAUDE.md, .ensemble等）を保持
3. Phase 1から順次実装開始

---

*以上*
