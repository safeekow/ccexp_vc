import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { getClaudeHomeDir, getCommandsDir, getClaudeMdPath, getSettingsPath } from '../utils/paths';

/**
 * Open file command
 */
export async function openFile(filePathOrItem: string | Record<string, unknown>): Promise<void> {
  // Get file path from argument
  let filePath: string | undefined;

  if (typeof filePathOrItem === 'string') {
    filePath = filePathOrItem;
  } else if (filePathOrItem && typeof filePathOrItem === 'object') {
    // Skip if it's a group (folder)
    if (filePathOrItem.isGroup === true) {
      console.log('[ccexp] Skipping group item');
      return;
    }

    // TreeItem case: commandInfo.path, agentInfo.path, fileInfo.path, settingsInfo.path etc.
    const info = filePathOrItem.commandInfo || filePathOrItem.agentInfo ||
                 filePathOrItem.fileInfo || filePathOrItem.settingsInfo;
    if (info && typeof (info as Record<string, unknown>).path === 'string') {
      filePath = (info as Record<string, unknown>).path as string;
    } else if (typeof filePathOrItem.path === 'string') {
      // If path property exists directly
      filePath = filePathOrItem.path;
    }
  }

  if (!filePath) {
    console.error(`[ccexp] Invalid argument: ${JSON.stringify(filePathOrItem)}`);
    vscode.window.showErrorMessage(vscode.l10n.t('Could not retrieve file path'));
    return;
  }

  console.log(`[ccexp] Opening file: ${filePath}`);
  try {
    // Check if file exists
    await fs.access(filePath);
    const uri = vscode.Uri.file(filePath);
    await vscode.window.showTextDocument(uri);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[ccexp] Could not open file: ${filePath}`, errorMessage);

    // File not found
    if (errorMessage.includes('ENOENT')) {
      const rescanLabel = vscode.l10n.t('Rescan');
      const action = await vscode.window.showErrorMessage(
        vscode.l10n.t('File not found: {0}', filePath),
        rescanLabel
      );
      if (action === rescanLabel) {
        await vscode.commands.executeCommand('ccexp.refresh');
      }
    } else {
      vscode.window.showErrorMessage(vscode.l10n.t('Could not open file: {0}', `${filePath}\n${errorMessage}`));
    }
  }
}

/**
 * Create slash command
 */
export async function createSlashCommand(): Promise<void> {
  // Select scope
  const scope = await vscode.window.showQuickPick(
    [
      { label: vscode.l10n.t('Project'), value: 'project', description: vscode.l10n.t('Create in .claude/commands/') },
      { label: vscode.l10n.t('User'), value: 'user', description: vscode.l10n.t('Create in ~/.claude/commands/') }
    ],
    { placeHolder: vscode.l10n.t('Select command scope') }
  );

  if (!scope) {
    return;
  }

  // Enter command name
  const commandName = await vscode.window.showInputBox({
    prompt: vscode.l10n.t('Enter command name (e.g., my-command)'),
    placeHolder: vscode.l10n.t('Command name'),
    validateInput: (value) => {
      if (!value) {
        return vscode.l10n.t('Please enter a command name');
      }
      if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(value)) {
        return vscode.l10n.t('Command name must start with a letter and can only contain letters, numbers, hyphens, and underscores');
      }
      return null;
    }
  });

  if (!commandName) {
    return;
  }

  // Enter namespace (optional)
  const namespace = await vscode.window.showInputBox({
    prompt: vscode.l10n.t('Enter namespace (optional, e.g., utils)'),
    placeHolder: vscode.l10n.t('Leave empty to create at root')
  });

  // Determine base directory
  let baseDir: string;
  if (scope.value === 'user') {
    baseDir = path.join(getClaudeHomeDir(), 'commands');
  } else {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage(vscode.l10n.t('No workspace is open'));
      return;
    }
    baseDir = getCommandsDir(workspaceFolder.uri.fsPath);
  }

  // Build file path
  const targetDir = namespace ? path.join(baseDir, namespace) : baseDir;
  const filePath = path.join(targetDir, `${commandName}.md`);

  // Create directory
  try {
    await fs.mkdir(targetDir, { recursive: true });
  } catch (error) {
    vscode.window.showErrorMessage(vscode.l10n.t('Could not create directory: {0}', targetDir));
    return;
  }

  // Create template
  const fullCommandName = namespace ? `${namespace}:${commandName}` : commandName;
  const template = `# ${fullCommandName}

${vscode.l10n.t('template.slashCommand.description')}

## ${vscode.l10n.t('template.slashCommand.usage')}

\`/${fullCommandName}\`

## ${vscode.l10n.t('template.slashCommand.content')}

${vscode.l10n.t('template.slashCommand.contentDescription')}
`;

  // Create file
  try {
    await fs.writeFile(filePath, template, 'utf-8');
    const uri = vscode.Uri.file(filePath);
    await vscode.window.showTextDocument(uri);
    vscode.window.showInformationMessage(vscode.l10n.t('Slash command /{0} created', fullCommandName));
  } catch (error) {
    vscode.window.showErrorMessage(vscode.l10n.t('Could not create file: {0}', filePath));
  }
}

/**
 * Create CLAUDE.md
 */
export async function createClaudeMd(): Promise<void> {
  // Select scope
  const scope = await vscode.window.showQuickPick(
    [
      { label: vscode.l10n.t('Project'), value: 'project', description: vscode.l10n.t('Create at project root') },
      { label: vscode.l10n.t('User'), value: 'user', description: vscode.l10n.t('Create in ~/.claude/') }
    ],
    { placeHolder: vscode.l10n.t('Select CLAUDE.md scope') }
  );

  if (!scope) {
    return;
  }

  // Select local version or not
  const isLocal = await vscode.window.showQuickPick(
    [
      { label: 'CLAUDE.md', value: false, description: vscode.l10n.t('Git tracked') },
      { label: 'CLAUDE.local.md', value: true, description: vscode.l10n.t('Local only (.gitignore recommended)') }
    ],
    { placeHolder: vscode.l10n.t('Select file type') }
  );

  if (isLocal === undefined) {
    return;
  }

  // Determine base directory
  let baseDir: string;
  if (scope.value === 'user') {
    baseDir = getClaudeHomeDir();
    // Create ~/.claude/ directory
    try {
      await fs.mkdir(baseDir, { recursive: true });
    } catch {
      // Ignore if already exists
    }
  } else {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage(vscode.l10n.t('No workspace is open'));
      return;
    }
    baseDir = workspaceFolder.uri.fsPath;
  }

  const filename = isLocal.value ? 'CLAUDE.local.md' : 'CLAUDE.md';
  const filePath = path.join(baseDir, filename);

  // Check if file exists
  try {
    await fs.access(filePath);
    const yesLabel = vscode.l10n.t('Yes');
    const noLabel = vscode.l10n.t('No');
    const overwrite = await vscode.window.showQuickPick(
      [
        { label: yesLabel, value: true },
        { label: noLabel, value: false }
      ],
      { placeHolder: vscode.l10n.t('{0} already exists. Overwrite?', filename) }
    );
    if (!overwrite?.value) {
      // Open existing file
      const uri = vscode.Uri.file(filePath);
      await vscode.window.showTextDocument(uri);
      return;
    }
  } catch {
    // Continue if file doesn't exist
  }

  // Create template
  const template = `# ${vscode.l10n.t('template.claudeMd.title')}

${vscode.l10n.t('template.claudeMd.description')}

## ${vscode.l10n.t('template.claudeMd.overview')}

${vscode.l10n.t('template.claudeMd.overviewPlaceholder')}

## ${vscode.l10n.t('template.claudeMd.codingStandards')}

- ${vscode.l10n.t('template.claudeMd.language')}
- ${vscode.l10n.t('template.claudeMd.framework')}
- ${vscode.l10n.t('template.claudeMd.styleGuide')}

## ${vscode.l10n.t('template.claudeMd.notes')}

${vscode.l10n.t('template.claudeMd.notesPlaceholder')}
`;

  // Create file
  try {
    await fs.writeFile(filePath, template, 'utf-8');
    const uri = vscode.Uri.file(filePath);
    await vscode.window.showTextDocument(uri);
    vscode.window.showInformationMessage(vscode.l10n.t('{0} created', filename));
  } catch (error) {
    vscode.window.showErrorMessage(vscode.l10n.t('Could not create file: {0}', filePath));
  }
}
