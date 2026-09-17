import * as vscode from 'vscode';
import { skillScanner } from '../scanners';
import type { SkillInfo, ScanOptions } from '../types';
import { getHomeDir } from '../utils/paths';
import { buildPathTree, type PathTreeNode } from '../utils/tree';

/**
 * Tree view provider for skills
 */
export class SkillsProvider implements vscode.TreeDataProvider<SkillItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<SkillItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private skills: SkillInfo[] = [];
  private workspacePath: string | undefined;
  private loaded = false;

  constructor() {
    this.workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  }

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  async loadSkills(): Promise<void> {
    const config = vscode.workspace.getConfiguration('ccexp');
    const options: ScanOptions = {
      includeHidden: config.get('showHiddenFiles', false),
      recursive: config.get('scanRecursively', true),
    };

    this.skills = await skillScanner.scan(this.workspacePath || '', options);
    this.loaded = true;
    this.refresh();
  }

  getTreeItem(element: SkillItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: SkillItem): Promise<SkillItem[]> {
    if (element && element.isGroup) {
      return element.getChildItems();
    }

    if (element) {
      return [];
    }

    if (!this.loaded) {
      await this.loadSkills();
    }

    const projectSkills = this.skills.filter(skill => skill.scope === 'project');
    const userSkills = this.skills.filter(skill => skill.scope === 'user');
    const viewMode = vscode.workspace.getConfiguration('ccexp').get<string>('viewMode', 'flat');

    const items: SkillItem[] = [];

    if (projectSkills.length > 0) {
      items.push(
        viewMode === 'tree'
          ? this.createTreeRootItem(vscode.l10n.t('Project'), projectSkills, this.workspacePath || '', 'project')
          : new SkillItem(
              vscode.l10n.t('Project'),
              vscode.TreeItemCollapsibleState.Expanded,
              undefined,
              true,
              projectSkills.map(skill => new SkillItem(
                skill.skillName,
                vscode.TreeItemCollapsibleState.None,
                skill
              )),
              'project'
            )
      );
    }

    if (userSkills.length > 0) {
      items.push(
        viewMode === 'tree'
          ? this.createTreeRootItem(vscode.l10n.t('User (~/.claude)'), userSkills, getHomeDir(), 'user')
          : new SkillItem(
              vscode.l10n.t('User (~/.claude)'),
              vscode.TreeItemCollapsibleState.Expanded,
              undefined,
              true,
              userSkills.map(skill => new SkillItem(
                skill.skillName,
                vscode.TreeItemCollapsibleState.None,
                skill
              )),
              'user'
            )
      );
    }

    if (items.length === 0) {
      return [new SkillItem(
        vscode.l10n.t('No skills found'),
        vscode.TreeItemCollapsibleState.None,
        undefined,
        false,
        []
      )];
    }

    return items;
  }

  private createTreeRootItem(
    label: string,
    skills: SkillInfo[],
    basePath: string,
    rootKind: 'project' | 'user'
  ): SkillItem {
    return new SkillItem(
      label,
      vscode.TreeItemCollapsibleState.Expanded,
      undefined,
      true,
      this.buildTreeItems(buildPathTree(skills, basePath)),
      rootKind
    );
  }

  private buildTreeItems(nodes: PathTreeNode<SkillInfo>[]): SkillItem[] {
    return nodes.map((node) => {
      if (node.item) {
        return new SkillItem(
          node.label,
          vscode.TreeItemCollapsibleState.None,
          node.item
        );
      }

      return new SkillItem(
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
 * Tree item for skills
 */
export class SkillItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly skillInfo?: SkillInfo,
    public readonly isGroup: boolean = false,
    public readonly children: SkillItem[] = [],
    public readonly rootKind?: 'project' | 'user'
  ) {
    super(label, collapsibleState);

    if (skillInfo) {
      this.tooltip = this.buildTooltip(skillInfo);
      this.description = skillInfo.description || '';
      this.iconPath = new vscode.ThemeIcon('library');
      this.contextValue = 'skill';
      this.command = {
        command: 'ccexp.openFile',
        title: vscode.l10n.t('Open file'),
        arguments: [skillInfo.path]
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

  private buildTooltip(info: SkillInfo): string {
    let tooltip = info.skillName;
    tooltip += `\n\n${vscode.l10n.t('Path: {0}', info.path)}`;
    if (info.description) {
      tooltip += `\n\n${info.description}`;
    }
    return tooltip;
  }

  getChildItems(): SkillItem[] {
    return this.children;
  }
}

export function createSkillsProvider(): SkillsProvider {
  return new SkillsProvider();
}
