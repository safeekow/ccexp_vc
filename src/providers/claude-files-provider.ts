import * as vscode from 'vscode';
import * as path from 'path';
import { claudeMdScanner } from '../scanners';
import type { ClaudeFileInfo, ScanOptions } from '../types';
import { getHomeDir } from '../utils/paths';
import { buildPathTree, type PathTreeNode } from '../utils/tree';

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
    if (element && element.isGroup) {
      return element.getChildItems();
    }

    if (element) {
      return [];
    }

    if (!this.loaded) {
      await this.loadFiles();
    }

    const projectFiles = this.files.filter(f => f.scope === 'project');
    const userFiles = this.files.filter(f => f.scope === 'user');
    const viewMode = vscode.workspace.getConfiguration('ccexp').get<string>('viewMode', 'flat');

    const items: ClaudeFileItem[] = [];

    if (projectFiles.length > 0) {
      items.push(
        viewMode === 'tree'
          ? this.createTreeRootItem(vscode.l10n.t('Project'), projectFiles, this.workspacePath || '', 'project')
          : new ClaudeFileItem(
              vscode.l10n.t('Project'),
              vscode.TreeItemCollapsibleState.Expanded,
              undefined,
              true,
              this.buildFlatItems(projectFiles, this.workspacePath || ''),
              'project'
            )
      );
    }

    if (userFiles.length > 0) {
      items.push(
        viewMode === 'tree'
          ? this.createTreeRootItem(vscode.l10n.t('User (~/.claude)'), userFiles, getHomeDir(), 'user')
          : new ClaudeFileItem(
              vscode.l10n.t('User (~/.claude)'),
              vscode.TreeItemCollapsibleState.Expanded,
              undefined,
              true,
              this.buildFlatItems(userFiles, getHomeDir()),
              'user'
            )
      );
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

  private buildFlatItems(files: ClaudeFileInfo[], basePath: string): ClaudeFileItem[] {
    const labels = this.buildFlatLabels(files, basePath);

    return files.map((file) => new ClaudeFileItem(
      labels.get(file.path) || path.basename(file.path),
      vscode.TreeItemCollapsibleState.None,
      file
    ));
  }

  private buildFlatLabels(files: ClaudeFileInfo[], basePath: string): Map<string, string> {
    const pathSegments = files.map((file) => ({
      file,
      segments: this.getDisplaySegments(file.path, basePath),
      isInClaudeDirectory: this.isInClaudeDirectory(file.path)
    }));

    const labels = new Map<string, string>();

    for (const current of pathSegments) {
      let depth = 1;
      let candidate = this.buildCandidateLabel(current.segments, depth);

      while (this.hasCollision(pathSegments, current.file.path, current.segments, candidate, depth)) {
        depth += 1;
        candidate = this.buildCandidateLabel(current.segments, depth);
      }

      labels.set(
        current.file.path,
        this.needsClaudeDirectoryFallback(pathSegments, current)
          ? `${candidate}/.claude/${path.basename(current.file.path)}`
          : candidate
      );
    }

    return labels;
  }

  private getDisplaySegments(filePath: string, basePath: string): string[] {
    const parentPath = path.dirname(filePath);
    const displayDirectory = path.basename(parentPath) === '.claude'
      ? path.dirname(parentPath)
      : parentPath;
    const relativeParentPath = basePath ? path.relative(basePath, displayDirectory) : displayDirectory;

    if (!relativeParentPath || relativeParentPath === '.') {
      const fallback = basePath ? path.basename(basePath) : path.basename(displayDirectory);
      return [fallback || path.basename(displayDirectory)];
    }

    if (relativeParentPath.startsWith('..')) {
      return [path.basename(displayDirectory)];
    }

    return relativeParentPath.split(path.sep).filter(Boolean);
  }

  private buildCandidateLabel(segments: string[], depth: number): string {
    return segments.slice(-depth).join('/');
  }

  private hasCollision(
    files: Array<{ file: ClaudeFileInfo; segments: string[] }>,
    currentPath: string,
    currentSegments: string[],
    candidate: string,
    depth: number
  ): boolean {
    return files.some((other) => {
      if (other.file.path === currentPath) {
        return false;
      }

      return this.buildCandidateLabel(other.segments, depth) === candidate
        && !this.sameSegments(other.segments, currentSegments);
    });
  }

  private sameSegments(a: string[], b: string[]): boolean {
    return a.length === b.length && a.every((segment, index) => segment === b[index]);
  }

  private isInClaudeDirectory(filePath: string): boolean {
    return path.basename(path.dirname(filePath)) === '.claude';
  }

  private needsClaudeDirectoryFallback(
    files: Array<{ file: ClaudeFileInfo; segments: string[]; isInClaudeDirectory: boolean }>,
    current: { file: ClaudeFileInfo; segments: string[]; isInClaudeDirectory: boolean }
  ): boolean {
    if (!current.isInClaudeDirectory) {
      return false;
    }

    return files.some((other) =>
      other.file.path !== current.file.path
      && this.sameSegments(other.segments, current.segments)
    );
  }

  private createTreeRootItem(
    label: string,
    files: ClaudeFileInfo[],
    basePath: string,
    rootKind: 'project' | 'user'
  ): ClaudeFileItem {
    return new ClaudeFileItem(
      label,
      vscode.TreeItemCollapsibleState.Expanded,
      undefined,
      true,
      this.buildTreeItems(buildPathTree(files, basePath)),
      rootKind
    );
  }

  private buildTreeItems(nodes: PathTreeNode<ClaudeFileInfo>[]): ClaudeFileItem[] {
    return nodes.map((node) => {
      if (node.item) {
        return new ClaudeFileItem(
          node.label,
          vscode.TreeItemCollapsibleState.None,
          node.item
        );
      }

      return new ClaudeFileItem(
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
 * Tree item for CLAUDE.md files
 */
export class ClaudeFileItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly fileInfo?: ClaudeFileInfo,
    public readonly isGroup: boolean = false,
    public readonly children: ClaudeFileItem[] = [],
    public readonly rootKind?: 'project' | 'user'
  ) {
    super(label, collapsibleState);

    if (fileInfo) {
      this.resourceUri = vscode.Uri.file(fileInfo.path);
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

  private getDescription(fileInfo: ClaudeFileInfo): string {
    const isLocal = fileInfo.type.includes('local');
    return isLocal ? '(local)' : '';
  }

  private getIcon(_fileInfo: ClaudeFileInfo): vscode.ThemeIcon {
    return vscode.ThemeIcon.File;
  }

  // Return children of the group
  getChildItems(): ClaudeFileItem[] {
    return this.children;
  }
}

// Factory function
export function createClaudeFilesProvider(): ClaudeFilesProvider {
  return new ClaudeFilesProvider();
}
