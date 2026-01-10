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
 * Extension activation
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log(vscode.l10n.t('Claude Code Explorer started'));

  // Create providers
  claudeFilesProvider = createClaudeFilesProvider();
  slashCommandsProvider = createSlashCommandsProvider();
  settingsProvider = createSettingsProvider();
  subAgentsProvider = createSubAgentsProvider();

  // Register tree views
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider('ccexp.claudeFiles', claudeFilesProvider),
    vscode.window.registerTreeDataProvider('ccexp.slashCommands', slashCommandsProvider),
    vscode.window.registerTreeDataProvider('ccexp.subAgents', subAgentsProvider),
    vscode.window.registerTreeDataProvider('ccexp.settings', settingsProvider)
  );

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('ccexp.openExplorer', () => {
      vscode.commands.executeCommand('workbench.view.extension.ccexp-explorer');
    }),

    vscode.commands.registerCommand('ccexp.refresh', () => {
      claudeFilesProvider.loadFiles();
      slashCommandsProvider.loadCommands();
      subAgentsProvider.loadAgents();
      settingsProvider.loadSettings();
      vscode.window.showInformationMessage(vscode.l10n.t('Claude Code Explorer: Rescan completed'));
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

  // Watch for file changes
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

  // Watch for configuration changes
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('ccexp')) {
        refreshAll();
      }
    })
  );

  // Initial scan
  refreshAll();
}

/**
 * Refresh all providers
 */
function refreshAll(): void {
  claudeFilesProvider.loadFiles();
  slashCommandsProvider.loadCommands();
  subAgentsProvider.loadAgents();
  settingsProvider.loadSettings();
}

/**
 * Extension deactivation
 */
export function deactivate(): void {
  console.log(vscode.l10n.t('Claude Code Explorer terminated'));
}
