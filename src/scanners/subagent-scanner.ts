import * as path from 'path';
import { BaseScanner } from './base-scanner';
import type { SubAgentInfo, ScanOptions, FileScope } from '../types';
import { FILE_SIZE_LIMITS, CLAUDE_FILE_PATTERNS } from '../types';
import { getClaudeHomeDir, isUserPath } from '../utils/paths';

/**
 * サブエージェントスキャナー
 */
export class SubAgentScanner extends BaseScanner<SubAgentInfo> {
  constructor() {
    super(FILE_SIZE_LIMITS.SUBAGENT);
  }

  /**
   * エージェント名を抽出（ファイル名から）
   */
  private extractAgentName(filePath: string): string {
    return path.basename(filePath, '.md');
  }

  /**
   * 説明を抽出
   * フロントマターまたはH1見出しから
   */
  private extractDescription(content: string): string | undefined {
    // フロントマターから抽出を試みる
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const descMatch = frontmatter.match(/description:\s*["']?([^"'\n]+)["']?/);
      if (descMatch) {
        return this.truncateDescription(descMatch[1].trim());
      }
    }

    // H1見出しから抽出
    const lines = content.split('\n');
    for (const line of lines) {
      const h1Match = line.match(/^#\s+(.+)$/);
      if (h1Match) {
        return this.truncateDescription(h1Match[1].trim());
      }
    }

    // 最初の非空行を使用
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('---') && !trimmed.startsWith('<!--')) {
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
   * ツール一覧を抽出
   */
  private extractTools(content: string): string[] | undefined {
    // フロントマターからtools配列を抽出
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      // tools: [tool1, tool2] 形式
      const toolsMatch = frontmatter.match(/tools:\s*\[(.*?)\]/);
      if (toolsMatch) {
        return toolsMatch[1]
          .split(',')
          .map(t => t.trim().replace(/["']/g, ''))
          .filter(t => t.length > 0);
      }
      // tools:
      //   - tool1
      //   - tool2 形式
      const toolsListMatch = frontmatter.match(/tools:\s*\n((?:\s+-\s+.+\n?)+)/);
      if (toolsListMatch) {
        return toolsListMatch[1]
          .split('\n')
          .map(line => line.replace(/^\s*-\s*/, '').trim())
          .filter(t => t.length > 0);
      }
    }
    return undefined;
  }

  /**
   * スコープを判定
   */
  private determineScope(filePath: string): FileScope {
    return isUserPath(filePath) ? 'user' : 'project';
  }

  protected async parseFile(filePath: string, content: string): Promise<SubAgentInfo | null> {
    const stats = await this.getFileStats(filePath);
    if (!stats) {
      return null;
    }

    const scope = this.determineScope(filePath);

    return {
      path: filePath,
      type: scope === 'user' ? 'user-subagent' : 'project-subagent',
      size: stats.size,
      modifiedAt: stats.modifiedAt,
      scope,
      agentName: this.extractAgentName(filePath),
      description: this.extractDescription(content),
      tools: this.extractTools(content),
    };
  }

  /**
   * サブエージェントをスキャン
   */
  async scan(workspacePath: string, options: ScanOptions = {}): Promise<SubAgentInfo[]> {
    const results: SubAgentInfo[] = [];

    // プロジェクト内のエージェントをスキャン（ワークスペースがある場合のみ）
    if (workspacePath) {
      const projectFiles = await this.findFiles(
        workspacePath,
        [...CLAUDE_FILE_PATTERNS.SUBAGENTS],
        options
      );
      const projectResults = await this.scanFiles(projectFiles);
      results.push(...projectResults);
    }

    // ユーザーホームのエージェントをスキャン
    const claudeHomeDir = getClaudeHomeDir();
    const userAgentsDir = path.join(claudeHomeDir, 'agents');

    const userFiles = await this.findFiles(userAgentsDir, ['**/*.md'], options);
    const userResults = await this.scanFiles(userFiles);
    results.push(...userResults);

    // 重複除去して更新日時でソート
    return this.sortByModifiedAt(this.uniqueByPath(results));
  }
}

// シングルトンインスタンス
export const subAgentScanner = new SubAgentScanner();
