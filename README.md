# kaito

カンバン＋AIのローカルデスクトップタスク管理アプリケーション。
Kanban + AI + Task Organizer = kaito

## Features

- **カンバンボード** - ドラッグ&ドロップ対応のタスク管理
- **AIチャットアシスタント** - Ollama連携によるローカルLLMチャット、タスク操作も可能
- **Jira連携** - スペース管理・課題表示・AIチャット付き
- **プロジェクト管理** - 複数プロジェクト対応
- **タスク詳細** - タグ、チェックリスト、説明の管理
- **ローカル完結** - SQLiteによるデータ保存（クラウド不要）

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 7, Tailwind CSS 4, dnd-kit
- **Backend**: Rust, Tauri 2, SQLite (sqlx), Ollama
- **Desktop**: Tauri 2（クロスプラットフォーム対応）

## Getting Started

### 前提条件

- [Rust](https://www.rust-lang.org/tools/install)
- [Node.js](https://nodejs.org/)
- [Ollama](https://ollama.com/)（ローカルLLM）

### インストール

```shell
git clone https://github.com/ChikaKakazu/kaito.git
cd kaito
npm install
cargo tauri dev
```

## Project Structure

```
kaito/
├── src/          # フロントエンド（React）
└── src-tauri/    # バックエンド（Rust / Tauri）
```

## License

MIT
