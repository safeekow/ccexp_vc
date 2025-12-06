import { claudeMdScanner } from './claude-md-scanner';
import { slashCommandScanner } from './slash-command-scanner';
import { settingsScanner } from './settings-scanner';
import { subAgentScanner } from './subagent-scanner';
import type { ClaudeFileInfo, SlashCommandInfo, SettingsInfo, SubAgentInfo, ScanOptions } from '../types';

export { BaseScanner } from './base-scanner';
export { claudeMdScanner } from './claude-md-scanner';
export { slashCommandScanner } from './slash-command-scanner';
export { settingsScanner } from './settings-scanner';
export { subAgentScanner } from './subagent-scanner';

/**
 * 統合スキャナー
 * すべての種類のClaude関連ファイルをスキャン
 */
export interface ScanResult {
  claudeFiles: ClaudeFileInfo[];
  slashCommands: SlashCommandInfo[];
  settings: SettingsInfo[];
  subAgents: SubAgentInfo[];
}

/**
 * すべてのClaude関連ファイルをスキャン
 */
export async function scanAll(
  workspacePath: string,
  options: ScanOptions = {}
): Promise<ScanResult> {
  const [claudeFiles, slashCommands, settings, subAgents] = await Promise.all([
    claudeMdScanner.scan(workspacePath, options),
    slashCommandScanner.scan(workspacePath, options),
    settingsScanner.scan(workspacePath, options),
    subAgentScanner.scan(workspacePath, options),
  ]);

  return {
    claudeFiles,
    slashCommands,
    settings,
    subAgents,
  };
}
