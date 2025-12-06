import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { getClaudeHomeDir, getCommandsDir, getClaudeMdPath, getSettingsPath } from '../utils/paths';

/**
 * ファイルを開くコマンド
 */
export async function openFile(filePath: string): Promise<void> {
  try {
    const uri = vscode.Uri.file(filePath);
    await vscode.window.showTextDocument(uri);
  } catch (error) {
    vscode.window.showErrorMessage(`ファイルを開けませんでした: ${filePath}`);
  }
}

/**
 * スラッシュコマンドを作成
 */
export async function createSlashCommand(): Promise<void> {
  // スコープを選択
  const scope = await vscode.window.showQuickPick(
    [
      { label: 'プロジェクト', value: 'project', description: '.claude/commands/ に作成' },
      { label: 'ユーザー', value: 'user', description: '~/.claude/commands/ に作成' }
    ],
    { placeHolder: 'コマンドのスコープを選択' }
  );

  if (!scope) {
    return;
  }

  // コマンド名を入力
  const commandName = await vscode.window.showInputBox({
    prompt: 'コマンド名を入力（例: my-command）',
    placeHolder: 'コマンド名',
    validateInput: (value) => {
      if (!value) {
        return 'コマンド名を入力してください';
      }
      if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(value)) {
        return 'コマンド名は英字で始まり、英数字・ハイフン・アンダースコアのみ使用可能です';
      }
      return null;
    }
  });

  if (!commandName) {
    return;
  }

  // 名前空間を入力（オプション）
  const namespace = await vscode.window.showInputBox({
    prompt: '名前空間を入力（オプション、例: utils）',
    placeHolder: '空白でルートに作成'
  });

  // ベースディレクトリを決定
  let baseDir: string;
  if (scope.value === 'user') {
    baseDir = path.join(getClaudeHomeDir(), 'commands');
  } else {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('ワークスペースが開かれていません');
      return;
    }
    baseDir = getCommandsDir(workspaceFolder.uri.fsPath);
  }

  // ファイルパスを構築
  const targetDir = namespace ? path.join(baseDir, namespace) : baseDir;
  const filePath = path.join(targetDir, `${commandName}.md`);

  // ディレクトリを作成
  try {
    await fs.mkdir(targetDir, { recursive: true });
  } catch (error) {
    vscode.window.showErrorMessage(`ディレクトリを作成できませんでした: ${targetDir}`);
    return;
  }

  // テンプレートを作成
  const fullCommandName = namespace ? `${namespace}:${commandName}` : commandName;
  const template = `# ${fullCommandName}

このコマンドの説明を記述してください。

## 使用方法

\`/${fullCommandName}\`

## 処理内容

コマンドが実行されたときの処理内容を記述してください。
`;

  // ファイルを作成
  try {
    await fs.writeFile(filePath, template, 'utf-8');
    const uri = vscode.Uri.file(filePath);
    await vscode.window.showTextDocument(uri);
    vscode.window.showInformationMessage(`スラッシュコマンド /${fullCommandName} を作成しました`);
  } catch (error) {
    vscode.window.showErrorMessage(`ファイルを作成できませんでした: ${filePath}`);
  }
}

/**
 * CLAUDE.mdを作成
 */
export async function createClaudeMd(): Promise<void> {
  // スコープを選択
  const scope = await vscode.window.showQuickPick(
    [
      { label: 'プロジェクト', value: 'project', description: 'プロジェクトルートに作成' },
      { label: 'ユーザー', value: 'user', description: '~/.claude/ に作成' }
    ],
    { placeHolder: 'CLAUDE.mdのスコープを選択' }
  );

  if (!scope) {
    return;
  }

  // ローカル版かどうかを選択
  const isLocal = await vscode.window.showQuickPick(
    [
      { label: 'CLAUDE.md', value: false, description: 'Git管理対象' },
      { label: 'CLAUDE.local.md', value: true, description: 'ローカルのみ（.gitignore推奨）' }
    ],
    { placeHolder: 'ファイルタイプを選択' }
  );

  if (isLocal === undefined) {
    return;
  }

  // ベースディレクトリを決定
  let baseDir: string;
  if (scope.value === 'user') {
    baseDir = getClaudeHomeDir();
    // ~/.claude/ ディレクトリを作成
    try {
      await fs.mkdir(baseDir, { recursive: true });
    } catch {
      // 既存の場合は無視
    }
  } else {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('ワークスペースが開かれていません');
      return;
    }
    baseDir = workspaceFolder.uri.fsPath;
  }

  const filename = isLocal.value ? 'CLAUDE.local.md' : 'CLAUDE.md';
  const filePath = path.join(baseDir, filename);

  // ファイルが存在するか確認
  try {
    await fs.access(filePath);
    const overwrite = await vscode.window.showQuickPick(
      [
        { label: 'はい', value: true },
        { label: 'いいえ', value: false }
      ],
      { placeHolder: `${filename} は既に存在します。上書きしますか？` }
    );
    if (!overwrite?.value) {
      // 既存ファイルを開く
      const uri = vscode.Uri.file(filePath);
      await vscode.window.showTextDocument(uri);
      return;
    }
  } catch {
    // ファイルが存在しない場合は続行
  }

  // テンプレートを作成
  const template = `# プロジェクト設定

このファイルには、Claude Codeへの指示やプロジェクト固有の設定を記述します。

## プロジェクト概要

プロジェクトの概要を記述してください。

## コーディング規約

- 言語:
- フレームワーク:
- スタイルガイド:

## 重要な注意事項

プロジェクト固有の注意事項を記述してください。
`;

  // ファイルを作成
  try {
    await fs.writeFile(filePath, template, 'utf-8');
    const uri = vscode.Uri.file(filePath);
    await vscode.window.showTextDocument(uri);
    vscode.window.showInformationMessage(`${filename} を作成しました`);
  } catch (error) {
    vscode.window.showErrorMessage(`ファイルを作成できませんでした: ${filePath}`);
  }
}
