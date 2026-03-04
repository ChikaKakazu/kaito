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

### 1. Ollamaのインストール

AIチャット機能を利用するために [Ollama](https://ollama.com/) が必要です。

**Linux:**

```shell
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows (PowerShell):**

```powershell
winget install Ollama.Ollama
```

インストール後、モデルをダウンロードします:

```shell
ollama pull qwen2.5:7b
```

> Ollamaはインストール時にバックグラウンドサービスとして自動起動されます。手動起動が必要な場合は `ollama serve` を実行してください。

### 2. Kaitoのインストール

[Releases](https://github.com/ChikaKakazu/kaito/releases) からお使いのOS向けのパッケージをダウンロードしてインストールしてください。RustやNode.jsは不要です。

- `.deb` - Debian/Ubuntu
- `.rpm` - Fedora/RHEL
- `.AppImage` - 汎用Linux

### 開発環境（ソースからビルドする場合）

[Rust](https://www.rust-lang.org/tools/install) と [Node.js](https://nodejs.org/) が追加で必要です。

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
