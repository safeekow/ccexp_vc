# Claude Code Explorer (VSCode拡張機能)

VSCode拡張機能としてClaude Codeの設定ファイルとスラッシュコマンドを探索・管理するツールです。

[ccexp](https://github.com/nyatinte/ccexp) のVSCode版として開発されました。

## 機能

### 📁 CLAUDE.md ファイル管理

- プロジェクト内の`CLAUDE.md`、`CLAUDE.local.md`を自動検出
- ユーザーホーム (`~/.claude/`) のグローバル設定も表示
- ワンクリックでファイルを開いて編集

### ⌨️ スラッシュコマンド管理

- プロジェクト・ユーザーのスラッシュコマンドを一覧表示
- コマンドの説明と引数の有無を表示
- 名前空間によるグループ化
- 新規スラッシュコマンドの作成ウィザード

### 🤖 サブエージェント管理

- プロジェクト・ユーザーのサブエージェントを一覧表示
- エージェント名、説明、使用ツールを表示
- ワンクリックでファイルを開いて編集

### ⚙️ 設定ファイル管理

- `settings.json`、`settings.local.json`の検出
- `~/.claude.json`（グローバル設定）の管理
- JSON形式の妥当性チェック
- 無効なJSONファイルを警告表示

## インストール

### 開発版のインストール

```bash
# リポジトリをクローン
git clone https://github.com/safeekow/ccexp_vc.git
cd ccexp_vc

# 依存関係をインストール
npm install

# ビルド
npm run compile

# VSCodeで開く
code .
```

VSCodeで開いた後、`F5`キーを押してExtension Development Hostを起動します。

### パッケージ化

```bash
# VSIXパッケージを作成
npm run package
```

生成された`.vsix`ファイルをVSCodeにインストールできます。

## 使い方

### エクスプローラーを開く

1. アクティビティバーのClaude Code Explorerアイコンをクリック
2. または、コマンドパレット (`Cmd+Shift+P`) から「Claude Code Explorer: 設定エクスプローラーを開く」を実行

### ファイルを開く

ツリービューのファイルをクリックすると、エディタで開きます。

### スラッシュコマンドを作成

1. スラッシュコマンドビューのタイトルバーにある `+` アイコンをクリック
2. スコープ（プロジェクト/ユーザー）を選択
3. コマンド名を入力
4. （オプション）名前空間を入力

### CLAUDE.mdを作成

コマンドパレットから「Claude Code Explorer: CLAUDE.mdを作成」を実行します。

### 再スキャン

ツリービューのタイトルバーにある更新アイコンをクリックすると、ファイルを再スキャンします。

## 設定

| 設定 | 説明 | デフォルト |
|------|------|-----------|
| `ccexp.showHiddenFiles` | 隠しファイルを表示 | `false` |
| `ccexp.scanRecursively` | サブディレクトリを再帰スキャン | `true` |
| `ccexp.autoRefresh` | ファイル変更時に自動再スキャン | `true` |

## コマンド

| コマンド | 説明 |
|---------|------|
| `ccexp.openExplorer` | エクスプローラーを開く |
| `ccexp.refresh` | ファイルを再スキャン |
| `ccexp.openFile` | ファイルを開く |
| `ccexp.createSlashCommand` | スラッシュコマンドを作成 |
| `ccexp.createClaudeMd` | CLAUDE.mdを作成 |

## 対応ファイル

### CLAUDE.md
- `CLAUDE.md` - プロジェクトのメモリファイル
- `CLAUDE.local.md` - ローカル専用メモリファイル
- `~/.claude/CLAUDE.md` - ユーザーグローバル設定

### スラッシュコマンド
- `.claude/commands/**/*.md` - プロジェクトコマンド
- `~/.claude/commands/**/*.md` - ユーザーコマンド

### サブエージェント
- `.claude/agents/**/*.md` - プロジェクトサブエージェント
- `~/.claude/agents/**/*.md` - ユーザーサブエージェント

### 設定
- `.claude/settings.json` - プロジェクト設定
- `.claude/settings.local.json` - ローカル専用設定
- `~/.claude/settings.json` - ユーザー設定
- `~/.claude/settings.local.json` - ユーザーローカル設定
- `~/.claude.json` - グローバル設定（ホームディレクトリ直下）

## 開発

```bash
# 開発モード（ファイル変更を監視）
npm run watch

# TypeScriptの型チェック
npx tsc --noEmit

# Lint
npm run lint
```

## ライセンス

MIT

## 関連プロジェクト

- [ccexp](https://github.com/nyatinte/ccexp) - オリジナルのCLIツール
- [Claude Code](https://claude.com/claude-code) - Anthropic公式CLI
