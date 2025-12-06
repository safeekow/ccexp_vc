import * as path from 'path';
import * as fs from 'fs/promises';
import { BaseScanner } from './base-scanner';
import type { SettingsInfo, ScanOptions, FileScope, ClaudeFileType } from '../types';
import { FILE_SIZE_LIMITS, CLAUDE_FILE_PATTERNS } from '../types';
import { getClaudeHomeDir, getHomeDir, isUserPath } from '../utils/paths';

/**
 * 設定ファイルスキャナー
 */
export class SettingsScanner extends BaseScanner<SettingsInfo> {
  constructor() {
    super(FILE_SIZE_LIMITS.SETTINGS);
  }

  /**
   * ファイルタイプを判定
   */
  private determineFileType(filePath: string): ClaudeFileType {
    const basename = path.basename(filePath);

    // ~/.claude.json の判定
    if (basename === '.claude.json') {
      return 'user-config';
    }

    const isLocal = basename === 'settings.local.json';
    const isUser = isUserPath(filePath);

    if (isUser) {
      return isLocal ? 'user-settings-local' : 'user-settings';
    }
    return isLocal ? 'project-settings-local' : 'project-settings';
  }

  /**
   * スコープを判定
   */
  private determineScope(filePath: string): FileScope {
    const basename = path.basename(filePath);
    // ~/.claude.json はユーザースコープ
    if (basename === '.claude.json') {
      return 'user';
    }
    return isUserPath(filePath) ? 'user' : 'project';
  }

  /**
   * JSONの妥当性を検証
   */
  private validateJson(content: string): boolean {
    try {
      JSON.parse(content);
      return true;
    } catch {
      return false;
    }
  }

  protected async parseFile(filePath: string, content: string): Promise<SettingsInfo | null> {
    const stats = await this.getFileStats(filePath);
    if (!stats) {
      return null;
    }

    const isValid = this.validateJson(content);
    if (!isValid) {
      console.warn(`無効なJSON: ${filePath}`);
    }

    const type = this.determineFileType(filePath);

    return {
      path: filePath,
      type: type as SettingsInfo['type'],
      size: stats.size,
      modifiedAt: stats.modifiedAt,
      scope: this.determineScope(filePath),
      isValid,
    };
  }

  /**
   * ファイルが存在するか確認してスキャン
   */
  private async scanIfExists(filePath: string): Promise<SettingsInfo | null> {
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
   * 設定ファイルをスキャン
   */
  async scan(workspacePath: string, options: ScanOptions = {}): Promise<SettingsInfo[]> {
    const results: SettingsInfo[] = [];

    // プロジェクト内の設定をスキャン（ワークスペースがある場合のみ）
    if (workspacePath) {
      const projectFiles = await this.findFiles(
        workspacePath,
        [...CLAUDE_FILE_PATTERNS.SETTINGS],
        options
      );
      const projectResults = await this.scanFiles(projectFiles);
      results.push(...projectResults);
    }

    // ユーザーホームの設定を直接スキャン
    const claudeHomeDir = getClaudeHomeDir();

    // ~/.claude/settings.json
    const userSettings = path.join(claudeHomeDir, 'settings.json');
    const userSettingsInfo = await this.scanIfExists(userSettings);
    if (userSettingsInfo) {
      results.push(userSettingsInfo);
    }

    // ~/.claude/settings.local.json
    const userSettingsLocal = path.join(claudeHomeDir, 'settings.local.json');
    const userSettingsLocalInfo = await this.scanIfExists(userSettingsLocal);
    if (userSettingsLocalInfo) {
      results.push(userSettingsLocalInfo);
    }

    // ~/.claude.json（ホームディレクトリ直下）
    const homeDir = getHomeDir();
    const userConfig = path.join(homeDir, '.claude.json');
    const userConfigInfo = await this.scanIfExists(userConfig);
    if (userConfigInfo) {
      results.push(userConfigInfo);
    }

    // 重複除去して更新日時でソート
    return this.sortByModifiedAt(this.uniqueByPath(results));
  }
}

// シングルトンインスタンス
export const settingsScanner = new SettingsScanner();
