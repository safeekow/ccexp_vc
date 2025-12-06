/**
 * Claude Code設定ファイルの型定義
 */

// ファイルの種類
export type ClaudeFileType =
  | 'project-memory'        // プロジェクトのCLAUDE.md
  | 'project-memory-local'  // プロジェクトのCLAUDE.local.md
  | 'user-memory'           // ユーザーの~/.claude/CLAUDE.md
  | 'user-memory-local'     // ユーザーの~/.claude/CLAUDE.local.md
  | 'project-command'       // プロジェクトのスラッシュコマンド
  | 'user-command'          // ユーザーのスラッシュコマンド
  | 'project-settings'      // プロジェクトのsettings.json
  | 'project-settings-local' // プロジェクトのsettings.local.json
  | 'user-settings'         // ユーザーのsettings.json
  | 'user-settings-local'   // ユーザーのsettings.local.json
  | 'user-config'           // ユーザーの~/.claude.json
  | 'project-subagent'      // プロジェクトのサブエージェント
  | 'user-subagent';        // ユーザーのサブエージェント

// ファイルのスコープ
export type FileScope = 'project' | 'user';

// ファイル情報
export interface ClaudeFileInfo {
  path: string;
  type: ClaudeFileType;
  size: number;
  modifiedAt: Date;
  scope: FileScope;
  // スラッシュコマンド固有
  commandName?: string;
  namespace?: string;
  description?: string;
  hasArgs?: boolean;
  // 設定ファイル固有
  isValid?: boolean;
  // サブエージェント固有
  agentName?: string;
  tools?: string[];
}

// スラッシュコマンド情報
export interface SlashCommandInfo extends ClaudeFileInfo {
  type: 'project-command' | 'user-command';
  commandName: string;
  namespace?: string;
  description?: string;
  hasArgs: boolean;
}

// 設定ファイル情報
export interface SettingsInfo extends ClaudeFileInfo {
  type: 'project-settings' | 'project-settings-local' | 'user-settings' | 'user-settings-local' | 'user-config';
  isValid: boolean;
}

// サブエージェント情報
export interface SubAgentInfo extends ClaudeFileInfo {
  type: 'project-subagent' | 'user-subagent';
  agentName: string;
  description?: string;
  tools?: string[];
}

// スキャンオプション
export interface ScanOptions {
  includeHidden?: boolean;
  recursive?: boolean;
  workspacePath?: string;
}

// ファイルグループ（ツリービュー用）
export interface FileGroup {
  label: string;
  scope: FileScope;
  files: ClaudeFileInfo[];
}

// 定数
export const FILE_SIZE_LIMITS = {
  CLAUDE_MD: 1024 * 1024,      // 1MB
  SLASH_COMMAND: 512 * 1024,   // 512KB
  SETTINGS: 1024 * 1024,       // 1MB
  SUBAGENT: 100 * 1024,        // 100KB
} as const;

// ファイルパターン
export const CLAUDE_FILE_PATTERNS = {
  // CLAUDE.mdファイル
  CLAUDE_MD: ['**/CLAUDE.md', '**/CLAUDE.local.md'],
  // スラッシュコマンド
  SLASH_COMMANDS: ['**/.claude/commands/**/*.md', '**/commands/**/*.md'],
  // 設定ファイル
  SETTINGS: ['**/.claude/settings.json', '**/.claude/settings.local.json'],
  // サブエージェント
  SUBAGENTS: ['**/.claude/agents/**/*.md'],
} as const;

// ホームディレクトリ配下のパターン
export const HOME_CLAUDE_PATTERNS = {
  CLAUDE_MD: ['.claude/CLAUDE.md', '.claude/CLAUDE.local.md'],
  COMMANDS: ['.claude/commands/**/*.md'],
  SETTINGS: ['.claude/settings.json', '.claude/settings.local.json'],
  AGENTS: ['.claude/agents/**/*.md'],
} as const;
