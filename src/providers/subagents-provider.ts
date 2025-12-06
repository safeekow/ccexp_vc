import * as vscode from 'vscode';
import * as path from 'path';
import { subAgentScanner } from '../scanners';
import type { SubAgentInfo, ScanOptions } from '../types';

/**
 * サブエージェントのツリービュープロバイダー
 */
export class SubAgentsProvider implements vscode.TreeDataProvider<SubAgentItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SubAgentItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private agents: SubAgentInfo[] = [];
  private workspacePath: string | undefined;
  private loaded = false;

  constructor() {
    this.workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  async loadAgents(): Promise<void> {
    const config = vscode.workspace.getConfiguration('ccexp');
    const options: ScanOptions = {
      includeHidden: config.get('showHiddenFiles', false),
      recursive: config.get('scanRecursively', true),
    };

    this.agents = await subAgentScanner.scan(this.workspacePath || '', options);
    this.loaded = true;
    this.refresh();
  }

  getTreeItem(element: SubAgentItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: SubAgentItem): Promise<SubAgentItem[]> {
    // グループの子要素を返す
    if (element && element.isGroup) {
      return element.getChildItems();
    }

    if (element) {
      return [];
    }

    if (!this.loaded) {
      await this.loadAgents();
    }

    // スコープでグループ化
    const projectAgents = this.agents.filter(a => a.scope === 'project');
    const userAgents = this.agents.filter(a => a.scope === 'user');

    const items: SubAgentItem[] = [];

    // プロジェクトエージェント
    if (projectAgents.length > 0) {
      items.push(new SubAgentItem(
        'プロジェクト',
        vscode.TreeItemCollapsibleState.Expanded,
        undefined,
        true,
        projectAgents
      ));
    }

    // ユーザーエージェント
    if (userAgents.length > 0) {
      items.push(new SubAgentItem(
        'ユーザー (~/.claude)',
        vscode.TreeItemCollapsibleState.Expanded,
        undefined,
        true,
        userAgents
      ));
    }

    if (items.length === 0) {
      return [new SubAgentItem(
        'サブエージェントが見つかりません',
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
 * サブエージェントのツリーアイテム
 */
export class SubAgentItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly agentInfo?: SubAgentInfo,
    public readonly isGroup: boolean = false,
    public readonly children: SubAgentInfo[] = []
  ) {
    super(label, collapsibleState);

    if (agentInfo) {
      this.tooltip = this.buildTooltip(agentInfo);
      this.description = agentInfo.description || '';
      this.iconPath = new vscode.ThemeIcon('robot');
      this.contextValue = 'subAgent';
      this.command = {
        command: 'ccexp.openFile',
        title: 'ファイルを開く',
        arguments: [agentInfo.path]
      };
    } else if (isGroup) {
      this.iconPath = new vscode.ThemeIcon('folder');
      this.contextValue = 'group';
    }
  }

  private buildTooltip(info: SubAgentInfo): string {
    let tooltip = `エージェント: ${info.agentName}`;
    tooltip += `\nパス: ${info.path}`;
    if (info.description) {
      tooltip += `\n\n${info.description}`;
    }
    if (info.tools && info.tools.length > 0) {
      tooltip += `\n\nツール: ${info.tools.join(', ')}`;
    }
    return tooltip;
  }

  // グループの子要素を返す
  getChildItems(): SubAgentItem[] {
    return this.children.map(agent => new SubAgentItem(
      agent.agentName,
      vscode.TreeItemCollapsibleState.None,
      agent
    ));
  }
}

// ファクトリ関数
export function createSubAgentsProvider(): SubAgentsProvider {
  return new SubAgentsProvider();
}
