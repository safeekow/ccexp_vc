import * as vscode from 'vscode';
import {
  createClaudeFilesProvider,
  createSlashCommandsProvider,
  createSettingsProvider,
  createSubAgentsProvider,
  ClaudeFilesProvider,
  SlashCommandsProvider,
  SettingsProvider,
  SubAgentsProvider
} from './providers';
import { openFile, createSlashCommand, createClaudeMd } from './commands';

let claudeFilesProvider: ClaudeFilesProvider;
let slashCommandsProvider: SlashCommandsProvider;
let settingsProvider: SettingsProvider;
let subAgentsProvider: SubAgentsProvider;

/**
 * 拡張機能のアクティベーション
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('Claude Code Explorer が起動しました');

  // プロバイダーを作成
  claudeFilesProvider = createClaudeFilesProvider();
  slashCommandsProvider = createSlashCommandsProvider();
  settingsProvider = createSettingsProvider();
  subAgentsProvider = createSubAgentsProvider();

  // ツリービューを登録
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('ccexp.claudeFiles', claudeFilesProvider),
    vscode.window.registerTreeDataProvider('ccexp.slashCommands', slashCommandsProvider),
    vscode.window.registerTreeDataProvider('ccexp.subAgents', subAgentsProvider),
    vscode.window.registerTreeDataProvider('ccexp.settings', settingsProvider)
  );

  // コマンドを登録
  context.subscriptions.push(
    vscode.commands.registerCommand('ccexp.openExplorer', () => {
      vscode.commands.executeCommand('workbench.view.extension.ccexp-explorer');
    }),

    vscode.commands.registerCommand('ccexp.refresh', () => {
      claudeFilesProvider.loadFiles();
      slashCommandsProvider.loadCommands();
      subAgentsProvider.loadAgents();
      settingsProvider.loadSettings();
      vscode.window.showInformationMessage('Claude Code Explorer: 再スキャン完了');
    }),

    vscode.commands.registerCommand('ccexp.openFile', (filePath: string) => {
      openFile(filePath);
    }),

    vscode.commands.registerCommand('ccexp.createSlashCommand', () => {
      createSlashCommand().then(() => {
        slashCommandsProvider.loadCommands();
      });
    }),

    vscode.commands.registerCommand('ccexp.createClaudeMd', () => {
      createClaudeMd().then(() => {
        claudeFilesProvider.loadFiles();
      });
    })
  );

  // ファイル変更の監視
  const config = vscode.workspace.getConfiguration('ccexp');
  if (config.get('autoRefresh', true)) {
    const watcher = vscode.workspace.createFileSystemWatcher(
      '**/{CLAUDE.md,CLAUDE.local.md,.claude/**/*.md,.claude/**/*.json}'
    );

    context.subscriptions.push(
      watcher.onDidCreate(() => refreshAll()),
      watcher.onDidDelete(() => refreshAll()),
      watcher.onDidChange(() => refreshAll()),
      watcher
    );
  }

  // 設定変更の監視
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('ccexp')) {
        refreshAll();
      }
    })
  );

  // 初回スキャン
  refreshAll();
}

/**
 * すべてのプロバイダーを更新
 */
function refreshAll(): void {
  claudeFilesProvider.loadFiles();
  slashCommandsProvider.loadCommands();
  subAgentsProvider.loadAgents();
  settingsProvider.loadSettings();
}

/**
 * 拡張機能の非アクティベーション
 */
export function deactivate(): void {
  console.log('Claude Code Explorer が終了しました');
}
