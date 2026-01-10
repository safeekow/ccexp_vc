import * as vscode from 'vscode';
import * as path from 'path';
import { claudeMdScanner } from '../scanners';
import type { ClaudeFileInfo, ScanOptions } from '../types';

/**
 * Tree view provider for CLAUDE.md files
 */
export class ClaudeFilesProvider implements vscode.TreeDataProvider<ClaudeFileItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ClaudeFileItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private files: ClaudeFileInfo[] = [];
  private workspacePath: string | undefined;
  private loaded = false;

  constructor() {
    this.workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  async loadFiles(): Promise<void> {
    const config = vscode.workspace.getConfiguration('ccexp');
    const options: ScanOptions = {
      includeHidden: config.get('showHiddenFiles', false),
      recursive: config.get('scanRecursively', true),
    };

    // User settings can be scanned even without a workspace
    this.files = await claudeMdScanner.scan(this.workspacePath || '', options);
    this.loaded = true;
    this.refresh();
  }

  getTreeItem(element: ClaudeFileItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: ClaudeFileItem): Promise<ClaudeFileItem[]> {
    // Return children of a group
    if (element && element.isGroup) {
      return element.getChildItems();
    }

    if (element) {
      return [];
    }

    if (!this.loaded) {
      await this.loadFiles();
    }

    // Group by scope
    const projectFiles = this.files.filter(f => f.scope === 'project');
    const userFiles = this.files.filter(f => f.scope === 'user');

    const items: ClaudeFileItem[] = [];

    // Project files
    if (projectFiles.length > 0) {
      items.push(new ClaudeFileItem(
        vscode.l10n.t('Project'),
        vscode.TreeItemCollapsibleState.Expanded,
        undefined,
        true,
        projectFiles
      ));
    }

    // User files
    if (userFiles.length > 0) {
      items.push(new ClaudeFileItem(
        vscode.l10n.t('User (~/.claude)'),
        vscode.TreeItemCollapsibleState.Expanded,
        undefined,
        true,
        userFiles
      ));
    }

    if (items.length === 0) {
      return [new ClaudeFileItem(
        vscode.l10n.t('No CLAUDE.md files found'),
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
 * Tree item for CLAUDE.md files
 */
export class ClaudeFileItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly fileInfo?: ClaudeFileInfo,
    public readonly isGroup: boolean = false,
    public readonly children: ClaudeFileInfo[] = []
  ) {
    super(label, collapsibleState);

    if (fileInfo) {
      this.tooltip = fileInfo.path;
      this.description = this.getDescription(fileInfo);
      this.iconPath = this.getIcon(fileInfo);
      this.contextValue = 'claudeFile';
      this.command = {
        command: 'ccexp.openFile',
        title: vscode.l10n.t('Open file'),
        arguments: [fileInfo.path]
      };
    } else if (isGroup) {
      this.iconPath = new vscode.ThemeIcon('folder');
      this.contextValue = 'group';
    }
  }

  private getDescription(fileInfo: ClaudeFileInfo): string {
    const isLocal = fileInfo.type.includes('local');
    return isLocal ? '(local)' : '';
  }

  private getIcon(fileInfo: ClaudeFileInfo): vscode.ThemeIcon {
    const isLocal = fileInfo.type.includes('local');
    return new vscode.ThemeIcon(isLocal ? 'file-symlink-file' : 'file-text');
  }

  // Return children of the group
  getChildItems(): ClaudeFileItem[] {
    return this.children.map(file => new ClaudeFileItem(
      path.basename(file.path),
      vscode.TreeItemCollapsibleState.None,
      file
    ));
  }
}

// Factory function
export function createClaudeFilesProvider(): ClaudeFilesProvider {
  return new ClaudeFilesProvider();
}
