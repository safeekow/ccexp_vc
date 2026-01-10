import * as vscode from 'vscode';
import * as path from 'path';
import { settingsScanner } from '../scanners';
import type { SettingsInfo, ScanOptions } from '../types';

/**
 * Tree view provider for settings files
 */
export class SettingsProvider implements vscode.TreeDataProvider<SettingsItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SettingsItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private settings: SettingsInfo[] = [];
  private workspacePath: string | undefined;
  private loaded = false;

  constructor() {
    this.workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  async loadSettings(): Promise<void> {
    const config = vscode.workspace.getConfiguration('ccexp');
    const options: ScanOptions = {
      includeHidden: config.get('showHiddenFiles', false),
      recursive: config.get('scanRecursively', true),
    };

    // User settings can be scanned even without a workspace
    this.settings = await settingsScanner.scan(this.workspacePath || '', options);
    this.loaded = true;
    this.refresh();
  }

  getTreeItem(element: SettingsItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: SettingsItem): Promise<SettingsItem[]> {
    if (element) {
      // Return children of a group
      if (element.isGroup) {
        return element.getChildItems();
      }
      return [];
    }

    if (!this.loaded) {
      await this.loadSettings();
    }

    // Group by scope
    const projectSettings = this.settings.filter(s => s.scope === 'project');
    const userSettings = this.settings.filter(s => s.scope === 'user');

    const items: SettingsItem[] = [];

    // Project settings
    if (projectSettings.length > 0) {
      items.push(new SettingsItem(
        vscode.l10n.t('Project'),
        vscode.TreeItemCollapsibleState.Expanded,
        undefined,
        true,
        projectSettings
      ));
    }

    // User settings
    if (userSettings.length > 0) {
      items.push(new SettingsItem(
        vscode.l10n.t('User (~/.claude)'),
        vscode.TreeItemCollapsibleState.Expanded,
        undefined,
        true,
        userSettings
      ));
    }

    if (items.length === 0) {
      return [new SettingsItem(
        vscode.l10n.t('No settings files found'),
        vscode.TreeItemCollapsibleState.None,
        undefined,
        false,
        []
      )];
    }

    return items;
  }
}

/**
 * Tree item for settings files
 */
export class SettingsItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly settingsInfo?: SettingsInfo,
    public readonly isGroup: boolean = false,
    public readonly children: SettingsInfo[] = []
  ) {
    super(label, collapsibleState);

    if (settingsInfo) {
      this.tooltip = this.buildTooltip(settingsInfo);
      this.description = this.getDescription(settingsInfo);
      this.iconPath = this.getIcon(settingsInfo);
      this.contextValue = 'settingsFile';
      this.command = {
        command: 'ccexp.openFile',
        title: vscode.l10n.t('Open file'),
        arguments: [settingsInfo.path]
      };
    } else if (isGroup) {
      this.iconPath = new vscode.ThemeIcon('folder');
      this.contextValue = 'group';
    }
  }

  private buildTooltip(info: SettingsInfo): string {
    let tooltip = info.path;
    if (!info.isValid) {
      tooltip += `\n\n⚠️ ${vscode.l10n.t('JSON format is invalid')}`;
    }
    return tooltip;
  }

  private getDescription(info: SettingsInfo): string {
    const parts: string[] = [];
    if (info.type.includes('local')) {
      parts.push('local');
    }
    if (!info.isValid) {
      parts.push(`⚠️ ${vscode.l10n.t('invalid')}`);
    }
    return parts.join(' | ');
  }

  private getIcon(info: SettingsInfo): vscode.ThemeIcon {
    if (!info.isValid) {
      return new vscode.ThemeIcon('warning', new vscode.ThemeColor('errorForeground'));
    }
    const isLocal = info.type.includes('local');
    return new vscode.ThemeIcon(isLocal ? 'file-symlink-file' : 'settings-gear');
  }

  // Return children of the group
  getChildItems(): SettingsItem[] {
    return this.children.map(setting => new SettingsItem(
      path.basename(setting.path),
      vscode.TreeItemCollapsibleState.None,
      setting
    ));
  }
}

// Factory function
export function createSettingsProvider(): SettingsProvider {
  return new SettingsProvider();
}
