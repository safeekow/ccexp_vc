import * as path from 'path';
import * as fs from 'fs/promises';
import { BaseScanner } from './base-scanner';
import type { ClaudeFileInfo, ClaudeFileType, ScanOptions, FileScope } from '../types';
import { FILE_SIZE_LIMITS, CLAUDE_FILE_PATTERNS } from '../types';
import { getClaudeHomeDir, getHomeDir, isUserPath } from '../utils/paths';

/**
 * CLAUDE.mdファイルスキャナー
 */
export class ClaudeMdScanner extends BaseScanner<ClaudeFileInfo> {
  constructor() {
    super(FILE_SIZE_LIMITS.CLAUDE_MD);
  }

  /**
   * ファイルタイプを判定
   */
  private determineFileType(filePath: string): ClaudeFileType {
    const basename = path.basename(filePath);
    const isLocal = basename === 'CLAUDE.local.md';
    const isUser = isUserPath(filePath);

    if (isUser) {
      return isLocal ? 'user-memory-local' : 'user-memory';
    }
    return isLocal ? 'project-memory-local' : 'project-memory';
  }

  /**
   * スコープを判定
   */
  private determineScope(filePath: string): FileScope {
    return isUserPath(filePath) ? 'user' : 'project';
  }

  protected async parseFile(filePath: string, _content: string): Promise<ClaudeFileInfo | null> {
    const stats = await this.getFileStats(filePath);
    if (!stats) {
      return null;
    }

    return {
      path: filePath,
      type: this.determineFileType(filePath),
      size: stats.size,
      modifiedAt: stats.modifiedAt,
      scope: this.determineScope(filePath),
    };
  }

  /**
   * ファイルが存在するか確認してスキャン
   */
  private async scanIfExists(filePath: string): Promise<ClaudeFileInfo | null> {
    try {
      await fs.access(filePath);
      const content = await this.readFileContent(filePath);
      if (content !== null) {
        return this.parseFile(filePath, content);
      }
    } catch {
      // ファイルが存在しない
    }
    return null;
  }

  /**
   * CLAUDE.mdファイルをスキャン
   */
  async scan(workspacePath: string, options: ScanOptions = {}): Promise<ClaudeFileInfo[]> {
    const results: ClaudeFileInfo[] = [];

    // プロジェクト内のCLAUDE.mdをスキャン（ワークスペースがある場合のみ）
    if (workspacePath) {
      const projectFiles = await this.findFiles(
        workspacePath,
        [...CLAUDE_FILE_PATTERNS.CLAUDE_MD],
        options
      );
      const projectResults = await this.scanFiles(projectFiles);
      results.push(...projectResults);
    }

    // ユーザーホームのCLAUDE.mdを直接スキャン
    const claudeHomeDir = getClaudeHomeDir();

    // ~/.claude/CLAUDE.md
    const userClaudeMd = path.join(claudeHomeDir, 'CLAUDE.md');
    const userClaudeMdInfo = await this.scanIfExists(userClaudeMd);
    if (userClaudeMdInfo) {
      results.push(userClaudeMdInfo);
    }

    // ~/.claude/CLAUDE.local.md
    const userClaudeLocalMd = path.join(claudeHomeDir, 'CLAUDE.local.md');
    const userClaudeLocalMdInfo = await this.scanIfExists(userClaudeLocalMd);
    if (userClaudeLocalMdInfo) {
      results.push(userClaudeLocalMdInfo);
    }

    // 重複除去して更新日時でソート
    return this.sortByModifiedAt(this.uniqueByPath(results));
  }
}

// シングルトンインスタンス
export const claudeMdScanner = new ClaudeMdScanner();
