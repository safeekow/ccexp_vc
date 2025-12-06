import * as path from 'path';
import * as os from 'os';

/**
 * パス関連のユーティリティ
 */

// ホームディレクトリを取得
export function getHomeDir(): string {
  return os.homedir();
}

// Claude設定のホームディレクトリを取得
export function getClaudeHomeDir(): string {
  return path.join(getHomeDir(), '.claude');
}

// コマンドディレクトリを取得
export function getCommandsDir(basePath: string): string {
  return path.join(basePath, '.claude', 'commands');
}

// 設定ファイルのパスを取得
export function getSettingsPath(basePath: string, isLocal = false): string {
  const filename = isLocal ? 'settings.local.json' : 'settings.json';
  return path.join(basePath, '.claude', filename);
}

// CLAUDE.mdのパスを取得
export function getClaudeMdPath(basePath: string, isLocal = false): string {
  const filename = isLocal ? 'CLAUDE.local.md' : 'CLAUDE.md';
  return path.join(basePath, filename);
}

// パスを短縮表示用に変換
export function shortenPath(fullPath: string, maxLength = 50): string {
  const home = getHomeDir();
  let displayPath = fullPath;

  // ホームディレクトリを~に置換
  if (fullPath.startsWith(home)) {
    displayPath = '~' + fullPath.slice(home.length);
  }

  // 長すぎる場合は省略
  if (displayPath.length > maxLength) {
    const parts = displayPath.split(path.sep);
    if (parts.length > 3) {
      return `${parts[0]}${path.sep}...${path.sep}${parts.slice(-2).join(path.sep)}`;
    }
  }

  return displayPath;
}

// ファイル名からコマンド名を抽出
export function extractCommandName(filePath: string): string {
  const basename = path.basename(filePath, '.md');
  return basename;
}

// コマンドの名前空間を抽出
export function extractNamespace(filePath: string, commandsDir: string): string | undefined {
  const relativePath = path.relative(commandsDir, filePath);
  const dir = path.dirname(relativePath);

  if (dir === '.' || dir === '') {
    return undefined;
  }

  return dir.replace(/\\/g, '/');
}

// パスがプロジェクト内かユーザー設定かを判定
export function isUserPath(filePath: string): boolean {
  const home = getHomeDir();
  const claudeHome = getClaudeHomeDir();
  return filePath.startsWith(claudeHome) || filePath === path.join(home, 'CLAUDE.md');
}

// 相対パスに変換
export function toRelativePath(fullPath: string, basePath: string): string {
  return path.relative(basePath, fullPath);
}
