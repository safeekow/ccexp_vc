# Claude Code Explorer

Claude Codeの設定ファイル、スラッシュコマンド、サブエージェントを直感的に管理できるVSCode拡張機能です。

![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/safeekow.ccexp-vscode)
![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/safeekow.ccexp-vscode)
![License](https://img.shields.io/github/license/safeekow/ccexp_vc)

![move](docs/ccexp_vc.gif)

## 特徴

- 🔍 **自動検出** - プロジェクトとユーザーの設定ファイルを自動スキャン
- 📂 **階層表示** - 名前空間やスコープ別にグループ化して表示
- ✏️ **ワンクリック編集** - ファイルをクリックするだけでエディタで開く
- ➕ **簡単作成** - ウィザード形式で新規ファイルを作成
- 🔄 **自動更新** - ファイル変更を検知して自動リフレッシュ

## 機能

### 📁 CLAUDE.md ファイル管理

プロジェクトメモリファイルの管理

- `CLAUDE.md` / `CLAUDE.local.md` の検出・編集
- ユーザーグローバル設定 (`~/.claude/CLAUDE.md`) のサポート
- プロジェクト/ユーザースコープの視覚的な区別

### ⌨️ スラッシュコマンド管理

カスタムコマンドの一覧表示と作成

- コマンドの説明と引数の有無を表示
- 名前空間によるグループ化 (例: `sc:build`, `sc:test`)
- 新規コマンドの作成ウィザード

### 🤖 サブエージェント管理

カスタムエージェントの管理

- エージェント名、説明、使用ツールを表示
- プロジェクト/ユーザースコープの表示

### ⚙️ 設定ファイル管理

JSON設定ファイルの管理

- `settings.json` / `settings.local.json` の検出
- `~/.claude.json` グローバル設定のサポート
- JSON形式の妥当性チェックと警告表示

## 使い方

### エクスプローラーを開く

1. アクティビティバーの **Claude Code Explorer** アイコンをクリック
2. または `Cmd+Shift+P` → 「Claude Code Explorer: 設定エクスプローラーを開く」

### ファイルを開く

ツリービューのファイルをクリックすると、エディタで開きます。

### スラッシュコマンドを作成

1. スラッシュコマンドビューの `+` アイコンをクリック
2. スコープ（プロジェクト/ユーザー）を選択
3. コマンド名を入力
4. （オプション）名前空間を入力

### CLAUDE.mdを作成

`Cmd+Shift+P` → 「Claude Code Explorer: CLAUDE.mdを作成」

## 設定

| 設定 | 説明 | デフォルト |
|------|------|-----------|
| `ccexp.showHiddenFiles` | 隠しファイルを表示 | `false` |
| `ccexp.scanRecursively` | サブディレクトリを再帰スキャン | `true` |
| `ccexp.autoRefresh` | ファイル変更時に自動再スキャン | `true` |

## 対応ファイル

| 種類 | プロジェクト | ユーザー |
|------|-------------|---------|
| CLAUDE.md | `./CLAUDE.md`, `./CLAUDE.local.md` | `~/.claude/CLAUDE.md` |
| スラッシュコマンド | `.claude/commands/**/*.md` | `~/.claude/commands/**/*.md` |
| サブエージェント | `.claude/agents/**/*.md` | `~/.claude/agents/**/*.md` |
| 設定 | `.claude/settings.json` | `~/.claude/settings.json`, `~/.claude.json` |

## 必要条件

- VSCode 1.85.0 以上
- [Claude Code](https://claude.ai/download) がインストールされていること（推奨）

## 関連リンク

- [Claude Code 公式ドキュメント](https://docs.anthropic.com/en/docs/claude-code)
- [ccexp (CLI版)](https://github.com/nyatinte/ccexp) - オリジナルのCLIツール
- [問題を報告](https://github.com/safeekow/ccexp_vc/issues)

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE.txt) を参照してください。
