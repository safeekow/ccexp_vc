import * as path from 'path';
import { BaseScanner } from './base-scanner';
import type { SlashCommandInfo, ScanOptions, FileScope } from '../types';
import { FILE_SIZE_LIMITS, CLAUDE_FILE_PATTERNS } from '../types';
import { getClaudeHomeDir, isUserPath, extractCommandName, extractNamespace } from '../utils/paths';

/**
 * スラッシュコマンドスキャナー
 */
export class SlashCommandScanner extends BaseScanner<SlashCommandInfo> {
  constructor() {
    super(FILE_SIZE_LIMITS.SLASH_COMMAND);
  }

  /**
   * コマンドの説明を抽出
   * H1見出しまたは最初の非空行を使用
   */
  private extractDescription(content: string): string | undefined {
    const lines = content.split('\n');

    // H1見出しを探す
    for (const line of lines) {
      const h1Match = line.match(/^#\s+(.+)$/);
      if (h1Match) {
        return this.truncateDescription(h1Match[1].trim());
      }
    }

    // H1がない場合、最初の非空行を使用
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('<!--')) {
        return this.truncateDescription(trimmed);
      }
    }

    return undefined;
  }

  /**
   * 説明を100文字で切り詰め
   */
  private truncateDescription(text: string): string {
    if (text.length <= 100) {
      return text;
    }
    return text.slice(0, 97) + '...';
  }

  /**
   * 引数の有無を検出
   * 各種パターン（角括弧、波括弧、変数構文など）を検出
   */
  private detectHasArgs(content: string): boolean {
    const patterns = [
      /\[.+?\]/,           // [arg]
      /\{.+?\}/,           // {arg}
      /\$\d+/,             // $1, $2
      /\$\{.+?\}/,         // ${arg}
      /<.+?>/,             // <arg>
      /--\w+/,             // --flag
      /-\w\s/,             // -f
    ];

    return patterns.some((pattern) => pattern.test(content));
  }

  /**
   * スコープを判定
   */
  private determineScope(filePath: string): FileScope {
    return isUserPath(filePath) ? 'user' : 'project';
  }

  protected async parseFile(filePath: string, content: string): Promise<SlashCommandInfo | null> {
    const stats = await this.getFileStats(filePath);
    if (!stats) {
      return null;
    }

    const scope = this.determineScope(filePath);

    // コマンドディレクトリを特定
    const commandsDir = scope === 'user'
      ? path.join(getClaudeHomeDir(), 'commands')
      : this.findCommandsDir(filePath);

    const commandName = extractCommandName(filePath);
    const namespace = commandsDir ? extractNamespace(filePath, commandsDir) : undefined;

    return {
      path: filePath,
      type: scope === 'user' ? 'user-command' : 'project-command',
      size: stats.size,
      modifiedAt: stats.modifiedAt,
      scope,
      commandName,
      namespace,
      description: this.extractDescription(content),
      hasArgs: this.detectHasArgs(content),
    };
  }

  /**
   * ファイルパスからコマンドディレクトリを特定
   */
  private findCommandsDir(filePath: string): string | undefined {
    const parts = filePath.split(path.sep);
    const commandsIndex = parts.findIndex((p) => p === 'commands');
    if (commandsIndex === -1) {
      return undefined;
    }
    return parts.slice(0, commandsIndex + 1).join(path.sep);
  }

  /**
   * スラッシュコマンドをスキャン
   */
  async scan(workspacePath: string, options: ScanOptions = {}): Promise<SlashCommandInfo[]> {
    const results: SlashCommandInfo[] = [];

    // プロジェクト内のコマンドをスキャン（ワークスペースがある場合のみ）
    if (workspacePath) {
      const projectFiles = await this.findFiles(
        workspacePath,
        [...CLAUDE_FILE_PATTERNS.SLASH_COMMANDS],
        options
      );
      const projectResults = await this.scanFiles(projectFiles);
      results.push(...projectResults);
    }

    // ユーザーホームのコマンドをスキャン
    const claudeHomeDir = getClaudeHomeDir();
    const userCommandsDir = path.join(claudeHomeDir, 'commands');

    const userFiles = await this.findFiles(userCommandsDir, ['**/*.md'], options);
    const userResults = await this.scanFiles(userFiles);
    results.push(...userResults);

    // 重複除去して更新日時でソート
    return this.sortByModifiedAt(this.uniqueByPath(results));
  }
}

// シングルトンインスタンス
export const slashCommandScanner = new SlashCommandScanner();
