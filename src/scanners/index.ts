import { claudeMdScanner } from './claude-md-scanner';
import { slashCommandScanner } from './slash-command-scanner';
import { skillScanner } from './skill-scanner';
import { settingsScanner } from './settings-scanner';
import { subAgentScanner } from './subagent-scanner';
import type { ClaudeFileInfo, SlashCommandInfo, SkillInfo, SettingsInfo, SubAgentInfo, ScanOptions } from '../types';

export { BaseScanner } from './base-scanner';
export { claudeMdScanner } from './claude-md-scanner';
export { slashCommandScanner } from './slash-command-scanner';
export { skillScanner } from './skill-scanner';
export { settingsScanner } from './settings-scanner';
export { subAgentScanner } from './subagent-scanner';

/**
 * 統合スキャナー
 * すべての種類のClaude関連ファイルをスキャン
 */
export interface ScanResult {
  claudeFiles: ClaudeFileInfo[];
  slashCommands: SlashCommandInfo[];
  skills: SkillInfo[];
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
  const [claudeFiles, slashCommands, skills, settings, subAgents] = await Promise.all([
    claudeMdScanner.scan(workspacePath, options),
    slashCommandScanner.scan(workspacePath, options),
    skillScanner.scan(workspacePath, options),
    settingsScanner.scan(workspacePath, options),
    subAgentScanner.scan(workspacePath, options),
  ]);

  return {
    claudeFiles,
    slashCommands,
    skills,
    settings,
    subAgents,
  };
}
