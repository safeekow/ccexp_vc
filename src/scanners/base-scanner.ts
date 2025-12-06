import * as fs from 'fs/promises';
import * as path from 'path';
import fg from 'fast-glob';
import type { ClaudeFileInfo, ScanOptions } from '../types';

/**
 * ベーススキャナークラス
 * 各種ファイルスキャナーの基底クラス
 */
export abstract class BaseScanner<T extends ClaudeFileInfo = ClaudeFileInfo> {
  protected maxFileSize: number;

  constructor(maxFileSize: number) {
    this.maxFileSize = maxFileSize;
  }

  /**
   * 指定パターンでファイルを検索
   */
  protected async findFiles(
    basePath: string,
    patterns: string[],
    options: ScanOptions = {}
  ): Promise<string[]> {
    const { includeHidden = false, recursive = true } = options;

    try {
      const files = await fg(patterns, {
        cwd: basePath,
        absolute: true,
        dot: includeHidden,
        deep: recursive ? Infinity : 1,
        onlyFiles: true,
        followSymbolicLinks: false,
        ignore: ['**/node_modules/**', '**/.git/**'],
      });

      return files;
    } catch (error) {
      console.error(`ファイル検索エラー: ${error}`);
      return [];
    }
  }

  /**
   * ファイルの統計情報を取得
   */
  protected async getFileStats(filePath: string): Promise<{
    size: number;
    modifiedAt: Date;
  } | null> {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        modifiedAt: stats.mtime,
      };
    } catch {
      return null;
    }
  }

  /**
   * ファイル内容を読み込み
   */
  protected async readFileContent(filePath: string): Promise<string | null> {
    try {
      const stats = await fs.stat(filePath);
      if (stats.size > this.maxFileSize) {
        console.warn(`ファイルサイズが上限を超えています: ${filePath}`);
        return null;
      }
      return await fs.readFile(filePath, 'utf-8');
    } catch {
      return null;
    }
  }

  /**
   * ファイルを解析して情報を取得（サブクラスで実装）
   */
  protected abstract parseFile(filePath: string, content: string): Promise<T | null>;

  /**
   * ファイルをスキャンして情報を取得
   */
  async scanFile(filePath: string): Promise<T | null> {
    const content = await this.readFileContent(filePath);
    if (content === null) {
      return null;
    }
    return this.parseFile(filePath, content);
  }

  /**
   * 複数ファイルをスキャン
   */
  async scanFiles(filePaths: string[]): Promise<T[]> {
    const results: T[] = [];
    for (const filePath of filePaths) {
      const info = await this.scanFile(filePath);
      if (info) {
        results.push(info);
      }
    }
    return results;
  }

  /**
   * 重複を除去
   */
  protected uniqueByPath<U extends { path: string }>(items: U[]): U[] {
    const seen = new Set<string>();
    return items.filter((item) => {
      if (seen.has(item.path)) {
        return false;
      }
      seen.add(item.path);
      return true;
    });
  }

  /**
   * 更新日時でソート（新しい順）
   */
  protected sortByModifiedAt<U extends { modifiedAt: Date }>(items: U[]): U[] {
    return items.sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime());
  }
}
