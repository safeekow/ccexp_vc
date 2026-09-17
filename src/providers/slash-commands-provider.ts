import * as vscode from 'vscode';
import * as path from 'path';
import { slashCommandScanner } from '../scanners';
import type { SlashCommandInfo, ScanOptions } from '../types';
import { getHomeDir } from '../utils/paths';
import { buildPathTree, type PathTreeNode } from '../utils/tree';

/**
 * Tree view provider for slash commands
 */
export class SlashCommandsProvider implements vscode.TreeDataProvider<SlashCommandItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SlashCommandItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private commands: SlashCommandInfo[] = [];
  private workspacePath: string | undefined;
  private loaded = false;

  constructor() {
    this.workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  async loadCommands(): Promise<void> {
    const config = vscode.workspace.getConfiguration('ccexp');
    const options: ScanOptions = {
      includeHidden: config.get('showHiddenFiles', false),
      recursive: config.get('scanRecursively', true),
    };

    // User commands can be scanned even without a workspace
    this.commands = await slashCommandScanner.scan(this.workspacePath || '', options);
    this.loaded = true;
    this.refresh();
  }

  getTreeItem(element: SlashCommandItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: SlashCommandItem): Promise<SlashCommandItem[]> {
    if (element) {
      if (element.isGroup) {
        return element.getChildItems();
      }
      return [];
    }

    if (!this.loaded) {
      await this.loadCommands();
    }

    const projectCommands = this.commands.filter(c => c.scope === 'project');
    const userCommands = this.commands.filter(c => c.scope === 'user');
    const viewMode = vscode.workspace.getConfiguration('ccexp').get<string>('viewMode', 'flat');

    const items: SlashCommandItem[] = [];

    if (projectCommands.length > 0) {
      items.push(
        viewMode === 'tree'
          ? this.createTreeRootItem(vscode.l10n.t('Project ({0})', projectCommands.length), projectCommands, this.workspacePath || '', 'project')
          : new SlashCommandItem(
              vscode.l10n.t('Project ({0})', projectCommands.length),
              vscode.TreeItemCollapsibleState.Expanded,
              undefined,
              true,
              this.buildFlatItems(projectCommands),
              'project'
            )
      );
    }

    if (userCommands.length > 0) {
      items.push(
        viewMode === 'tree'
          ? this.createTreeRootItem(vscode.l10n.t('User (~/.claude/commands/) ({0})', userCommands.length), userCommands, getHomeDir(), 'user')
          : new SlashCommandItem(
              vscode.l10n.t('User (~/.claude/commands/) ({0})', userCommands.length),
              vscode.TreeItemCollapsibleState.Expanded,
              undefined,
              true,
              this.buildFlatItems(userCommands),
              'user'
            )
      );
    }

    if (items.length === 0) {
      return [new SlashCommandItem(
        vscode.l10n.t('No slash commands found'),
        vscode.TreeItemCollapsibleState.None,
        undefined,
        false,
        []
      )];
    }

    return items;
  }

  private buildFlatItems(commands: SlashCommandInfo[]): SlashCommandItem[] {
    return commands.map((cmd) => new SlashCommandItem(
      cmd.namespace ? `/${cmd.namespace}:${cmd.commandName}` : `/${cmd.commandName}`,
      vscode.TreeItemCollapsibleState.None,
      cmd
    ));
  }

  private createTreeRootItem(
    label: string,
    commands: SlashCommandInfo[],
    basePath: string,
    rootKind: 'project' | 'user'
  ): SlashCommandItem {
    return new SlashCommandItem(
      label,
      vscode.TreeItemCollapsibleState.Expanded,
      undefined,
      true,
      this.buildTreeItems(buildPathTree(commands, basePath)),
      rootKind
    );
  }

  private buildTreeItems(nodes: PathTreeNode<SlashCommandInfo>[]): SlashCommandItem[] {
    return nodes.map((node) => {
      if (node.item) {
        return new SlashCommandItem(
          node.label,
          vscode.TreeItemCollapsibleState.None,
          node.item
        );
      }

      return new SlashCommandItem(
        node.label,
        vscode.TreeItemCollapsibleState.Collapsed,
        undefined,
        true,
        this.buildTreeItems(node.children)
      );
    });
  }
}

/**
 * Tree item for slash commands
 */
export class SlashCommandItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly commandInfo?: SlashCommandInfo,
    public readonly isGroup: boolean = false,
    public readonly children: SlashCommandItem[] = [],
    public readonly rootKind?: 'project' | 'user'
  ) {
    super(label, collapsibleState);

    if (commandInfo) {
      this.tooltip = this.buildTooltip(commandInfo);
      this.description = this.buildDescription(commandInfo);
      this.iconPath = this.getIcon(commandInfo);
      this.contextValue = 'slashCommand';
      this.command = {
        command: 'ccexp.openFile',
        title: vscode.l10n.t('Open file'),
        arguments: [commandInfo.path]
      };
    } else if (isGroup) {
      this.iconPath = this.getGroupIcon();
      this.contextValue = 'group';
    }
  }

  private getGroupIcon(): vscode.ThemeIcon {
    if (this.rootKind === 'project') {
      return new vscode.ThemeIcon('git-branch');
    }

    if (this.rootKind === 'user') {
      return new vscode.ThemeIcon('account');
    }

    return new vscode.ThemeIcon('folder');
  }

  private buildTooltip(info: SlashCommandInfo): string {
    let tooltip = `/${info.commandName}`;
    if (info.namespace) {
      tooltip = `/${info.namespace}:${info.commandName}`;
    }
    if (info.hasArgs) {
      tooltip += ` ${vscode.l10n.t('[has arguments]')}`;
    }
    tooltip += `\n\n${vscode.l10n.t('Path: {0}', info.path)}`;
    if (info.description) {
      tooltip += `\n\n${info.description}`;
    }
    return tooltip;
  }

  private buildDescription(info: SlashCommandInfo): string {
    // Display parent directory name (e.g., ~/.claude/commands/sc)
    const dirPath = path.dirname(info.path);
    const home = process.env.HOME || '';
    let displayPath = dirPath;
    if (home && dirPath.startsWith(home)) {
      displayPath = '~' + dirPath.slice(home.length);
    }

    const parts: string[] = [`(${displayPath})`];
    if (info.scope === 'user') {
      parts.push('USER');
    }
    return parts.join('  ');
  }

  private getIcon(info: SlashCommandInfo): vscode.ThemeIcon {
    return new vscode.ThemeIcon(info.hasArgs ? 'symbol-function' : 'symbol-event');
  }

  // Return children of the group
  getChildItems(): SlashCommandItem[] {
    return this.children;
  }
}

// Factory function
export function createSlashCommandsProvider(): SlashCommandsProvider {
  return new SlashCommandsProvider();
}
