import * as vscode from 'vscode';
import * as path from 'path';
import { subAgentScanner } from '../scanners';
import type { SubAgentInfo, ScanOptions } from '../types';

/**
 * Tree view provider for sub-agents
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
    // Return children of a group
    if (element && element.isGroup) {
      return element.getChildItems();
    }

    if (element) {
      return [];
    }

    if (!this.loaded) {
      await this.loadAgents();
    }

    // Group by scope
    const projectAgents = this.agents.filter(a => a.scope === 'project');
    const userAgents = this.agents.filter(a => a.scope === 'user');

    const items: SubAgentItem[] = [];

    // Project agents
    if (projectAgents.length > 0) {
      items.push(new SubAgentItem(
        vscode.l10n.t('Project'),
        vscode.TreeItemCollapsibleState.Expanded,
        undefined,
        true,
        projectAgents
      ));
    }

    // User agents
    if (userAgents.length > 0) {
      items.push(new SubAgentItem(
        vscode.l10n.t('User (~/.claude)'),
        vscode.TreeItemCollapsibleState.Expanded,
        undefined,
        true,
        userAgents
      ));
    }

    if (items.length === 0) {
      return [new SubAgentItem(
        vscode.l10n.t('No sub-agents found'),
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
 * Tree item for sub-agents
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
        title: vscode.l10n.t('Open file'),
        arguments: [agentInfo.path]
      };
    } else if (isGroup) {
      this.iconPath = new vscode.ThemeIcon('folder');
      this.contextValue = 'group';
    }
  }

  private buildTooltip(info: SubAgentInfo): string {
    let tooltip = vscode.l10n.t('Agent: {0}', info.agentName);
    tooltip += `\n${vscode.l10n.t('Path: {0}', info.path)}`;
    if (info.description) {
      tooltip += `\n\n${info.description}`;
    }
    if (info.tools && info.tools.length > 0) {
      tooltip += `\n\n${vscode.l10n.t('Tools: {0}', info.tools.join(', '))}`;
    }
    return tooltip;
  }

  // Return children of the group
  getChildItems(): SubAgentItem[] {
    return this.children.map(agent => new SubAgentItem(
      agent.agentName,
      vscode.TreeItemCollapsibleState.None,
      agent
    ));
  }
}

// Factory function
export function createSubAgentsProvider(): SubAgentsProvider {
  return new SubAgentsProvider();
}
