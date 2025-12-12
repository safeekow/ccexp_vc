# Claude Code Explorer

Claude Code（Anthropic Claude AI）の設定ファイル、スラッシュコマンド、サブエージェントを管理する強力なVSCode拡張機能です。直感的なツリービューインターフェースで、CLAUDE.mdファイル、カスタムスラッシュコマンド、サブエージェント、設定ファイルを簡単に探索、編集、作成できます。

> **注記:** このVSCode拡張機能は、[ccexp](https://github.com/nyatinte/ccexp)（CLI版）と同じ機能を拡張機能として提供するものです。CLI版を使用していて、同様の機能をVSCode内で直接使いたいと考えていた方のために開発されました。
>
> この拡張機能の開発にインスピレーションを与えてくれた、[@nyatinte](https://github.com/nyatinte) によるオリジナルの [ccexp](https://github.com/nyatinte/ccexp) CLIツールに感謝いたします。

![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/safeekow.ccexp-vscode)
![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/safeekow.ccexp-vscode)
![License](https://img.shields.io/github/license/safeekow/ccexp_vc)

![demo](docs/ccexp_vc.gif)

## 特徴

- 🔍 **自動検出** - Claude Codeのプロジェクトとユーザー設定ファイルを自動スキャン
- 📂 **階層表示** - 名前空間やスコープ（プロジェクト vs ユーザー）別にグループ化して表示
- ✏️ **ワンクリック編集** - ツリービューのファイルをクリックするだけでエディタで開く
- ➕ **簡単作成** - スラッシュコマンドやCLAUDE.mdファイルをウィザード形式で作成
- 🔄 **自動更新** - ファイル変更を自動検知してビューをリフレッシュ
- 🎯 **マルチスコープ対応** - プロジェクトレベルとユーザーレベルのClaude Code設定を両方管理

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

## Claude Code Explorerを使う理由

**Claude Code**（AnthropicのAIコーディングアシスタント）を使用している場合、この拡張機能により以下が簡単になります：
- **発見** - すべてのClaude Code設定ファイルを一箇所で確認
- **整理** - 名前空間別にスラッシュコマンドを整理
- **管理** - サブエージェントとその設定を管理
- **編集** - 複雑なディレクトリ構造をナビゲートせずにCLAUDE.mdファイルを編集
- **作成** - ガイド付きウィザードで新しいコマンドや設定を作成

Claude Codeで生産性を最大化したい開発者に最適です！

## 必要条件

- VSCode 1.85.0 以上
- [Claude Code](https://claude.ai/download) がインストールされていること（推奨）

## 謝辞

この拡張機能は、[@nyatinte](https://github.com/nyatinte) によって作成された優れた [ccexp](https://github.com/nyatinte/ccexp) CLIツールにインスピレーションを受け、同じ機能を提供するために開発されました。このVSCode拡張機能の実現を可能にしてくれたオリジナルの作品に感謝いたします。

## 関連リンク

- [Claude Code 公式ドキュメント](https://docs.anthropic.com/en/docs/claude-code)
- [ccexp (CLI版)](https://github.com/nyatinte/ccexp) - [@nyatinte](https://github.com/nyatinte) によるオリジナルのCLIツール
- [問題を報告](https://github.com/safeekow/ccexp_vc/issues)

## ライセンス

MIT License - 詳細は [LICENSE](LICENSE.txt) を参照してください。
