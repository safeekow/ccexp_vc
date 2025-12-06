import * as vscode from 'vscode';
import * as path from 'path';
import { slashCommandScanner } from '../scanners';
import type { SlashCommandInfo, ScanOptions } from '../types';

/**
 * スラッシュコマンドのツリービュープロバイダー
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

    // ワークスペースがなくてもユーザーコマンドはスキャン可能
    this.commands = await slashCommandScanner.scan(this.workspacePath || '', options);
    this.loaded = true;
    this.refresh();
  }

  getTreeItem(element: SlashCommandItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: SlashCommandItem): Promise<SlashCommandItem[]> {
    if (element) {
      // グループの子要素を返す
      if (element.isGroup) {
        return element.getChildItems();
      }
      return [];
    }

    if (!this.loaded) {
      await this.loadCommands();
    }

    // スコープでグループ化
    const projectCommands = this.commands.filter(c => c.scope === 'project');
    const userCommands = this.commands.filter(c => c.scope === 'user');

    const items: SlashCommandItem[] = [];

    // プロジェクトコマンド
    if (projectCommands.length > 0) {
      items.push(new SlashCommandItem(
        `プロジェクト (${projectCommands.length})`,
        vscode.TreeItemCollapsibleState.Expanded,
        undefined,
        true,
        projectCommands
      ));
    }

    // ユーザーコマンド
    if (userCommands.length > 0) {
      items.push(new SlashCommandItem(
        `ユーザー (~/.claude/commands/) (${userCommands.length})`,
        vscode.TreeItemCollapsibleState.Expanded,
        undefined,
        true,
        userCommands
      ));
    }

    if (items.length === 0) {
      return [new SlashCommandItem(
        'スラッシュコマンドが見つかりません',
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
 * スラッシュコマンドのツリーアイテム
 */
export class SlashCommandItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly commandInfo?: SlashCommandInfo,
    public readonly isGroup: boolean = false,
    public readonly children: SlashCommandInfo[] = []
  ) {
    super(label, collapsibleState);

    if (commandInfo) {
      this.tooltip = this.buildTooltip(commandInfo);
      this.description = this.buildDescription(commandInfo);
      this.iconPath = this.getIcon(commandInfo);
      this.contextValue = 'slashCommand';
      this.command = {
        command: 'ccexp.openFile',
        title: 'ファイルを開く',
        arguments: [commandInfo.path]
      };
    } else if (isGroup) {
      this.iconPath = new vscode.ThemeIcon('folder');
      this.contextValue = 'group';
    }
  }

  private buildTooltip(info: SlashCommandInfo): string {
    let tooltip = `/${info.commandName}`;
    if (info.namespace) {
      tooltip = `/${info.namespace}:${info.commandName}`;
    }
    if (info.hasArgs) {
      tooltip += ' [引数あり]';
    }
    tooltip += `\n\nパス: ${info.path}`;
    if (info.description) {
      tooltip += `\n\n${info.description}`;
    }
    return tooltip;
  }

  private buildDescription(info: SlashCommandInfo): string {
    // パスの親ディレクトリ名を表示（例: ~/.claude/commands/sc）
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

  // グループの子要素を返す
  getChildItems(): SlashCommandItem[] {
    // 名前空間でさらにグループ化
    const byNamespace = new Map<string, SlashCommandInfo[]>();

    for (const cmd of this.children) {
      const ns = cmd.namespace || '';
      if (!byNamespace.has(ns)) {
        byNamespace.set(ns, []);
      }
      byNamespace.get(ns)!.push(cmd);
    }

    const items: SlashCommandItem[] = [];

    // 名前空間なしのコマンド
    const rootCommands = byNamespace.get('') || [];
    for (const cmd of rootCommands) {
      items.push(new SlashCommandItem(
        `/${cmd.commandName}`,
        vscode.TreeItemCollapsibleState.None,
        cmd
      ));
    }

    // 名前空間ありのコマンド
    for (const [ns, cmds] of byNamespace.entries()) {
      if (ns === '') continue;

      for (const cmd of cmds) {
        items.push(new SlashCommandItem(
          `/${ns}:${cmd.commandName}`,
          vscode.TreeItemCollapsibleState.None,
          cmd
        ));
      }
    }

    return items;
  }
}

// ファクトリ関数
export function createSlashCommandsProvider(): SlashCommandsProvider {
  return new SlashCommandsProvider();
}
