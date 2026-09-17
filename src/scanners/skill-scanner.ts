import * as path from 'path';
import { BaseScanner } from './base-scanner';
import type { SkillInfo, ScanOptions, FileScope } from '../types';
import { FILE_SIZE_LIMITS, CLAUDE_FILE_PATTERNS } from '../types';
import { getClaudeHomeDir, isUserPath } from '../utils/paths';

/**
 * スキルスキャナー
 */
export class SkillScanner extends BaseScanner<SkillInfo> {
  constructor() {
    super(FILE_SIZE_LIMITS.SKILL);
  }

  private extractSkillName(filePath: string): string {
    return path.basename(path.dirname(filePath));
  }

  private extractDescription(content: string): string | undefined {
    const lines = content.split('\n');

    for (const line of lines) {
      const h1Match = line.match(/^#\s+(.+)$/);
      if (h1Match) {
        return this.truncateDescription(h1Match[1].trim());
      }
    }

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('<!--')) {
        return this.truncateDescription(trimmed);
      }
    }

    return undefined;
  }

  private truncateDescription(text: string): string {
    if (text.length <= 100) {
      return text;
    }

    return text.slice(0, 97) + '...';
  }

  private determineScope(filePath: string): FileScope {
    return isUserPath(filePath) ? 'user' : 'project';
  }

  protected async parseFile(filePath: string, content: string): Promise<SkillInfo | null> {
    const stats = await this.getFileStats(filePath);
    if (!stats) {
      return null;
    }

    const scope = this.determineScope(filePath);

    return {
      path: filePath,
      type: scope === 'user' ? 'user-skill' : 'project-skill',
      size: stats.size,
      modifiedAt: stats.modifiedAt,
      scope,
      skillName: this.extractSkillName(filePath),
      description: this.extractDescription(content),
    };
  }

  async scan(workspacePath: string, options: ScanOptions = {}): Promise<SkillInfo[]> {
    const results: SkillInfo[] = [];

    if (workspacePath) {
      const projectFiles = await this.findFiles(
        workspacePath,
        [...CLAUDE_FILE_PATTERNS.SKILLS],
        options
      );
      const projectResults = await this.scanFiles(projectFiles);
      results.push(...projectResults);
    }

    const userSkillsDir = path.join(getClaudeHomeDir(), 'skills');
    const userFiles = await this.findFiles(userSkillsDir, ['**/SKILL.md'], options);
    const userResults = await this.scanFiles(userFiles);
    results.push(...userResults);

    return this.sortByModifiedAt(this.uniqueByPath(results));
  }
}

export const skillScanner = new SkillScanner();
