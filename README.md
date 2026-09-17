# Claude Code Explorer

A powerful VSCode extension for managing Claude Code (Anthropic Claude AI) configuration files, slash commands, and sub-agents. Easily explore, edit, and create CLAUDE.md files, custom slash commands, sub-agents, and settings files with an intuitive tree view interface.

> **Note:** This VSCode extension provides the same functionality as [ccexp](https://github.com/nyatinte/ccexp) (the CLI tool) in a convenient extension format. If you've used the CLI version and wanted to use similar features directly in VSCode, this extension is for you!
>
> Special thanks to [@nyatinte](https://github.com/nyatinte) for creating the original [ccexp](https://github.com/nyatinte/ccexp) CLI tool that inspired this extension.

![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/safeekow.ccexp-vscode)
![Visual Studio Marketplace Installs](https://img.shields.io/visual-studio-marketplace/i/safeekow.ccexp-vscode)
![License](https://img.shields.io/github/license/safeekow/ccexp_vc)

![demo](docs/ccexp_vc.gif)

## Features

- 🔍 **Auto Detection** - Automatically scans project and user configuration files for Claude Code
- 📂 **Hierarchical View** - Groups files by namespace and scope (project vs user)
- ✏️ **One-Click Edit** - Click any file in the tree view to open it in the editor
- ➕ **Easy Creation** - Wizard-style creation for slash commands and CLAUDE.md files
- 🔄 **Auto Refresh** - Automatically detects file changes and refreshes the view
- 🎯 **Multi-Scope Support** - Manage both project-level and user-level Claude Code configurations

## Capabilities

### 📁 CLAUDE.md File Management

Manage project memory files

- Detect and edit `CLAUDE.md` / `CLAUDE.local.md`
- Support for user global settings (`~/.claude/CLAUDE.md`)
- Visual distinction between project/user scopes

### ⌨️ Slash Command Management

List and create custom commands

- Display command descriptions and argument information
- Group by namespace (e.g., `sc:build`, `sc:test`)
- New command creation wizard

### 🤖 Sub-Agent Management

Manage custom agents

- Display agent name, description, and available tools
- Show project/user scope

### 🧠 Skills Management

Manage Claude Code skills

- Detect skill manifests from `.claude/skills/**/SKILL.md`
- Show skill names and descriptions
- Show project/user scope

### ⚙️ Settings File Management

Manage JSON configuration files

- Detect `settings.json` / `settings.local.json`
- Support for `~/.claude.json` global settings
- JSON validation with warning display

## Usage

### Open Explorer

1. Click the **Claude Code Explorer** icon in the Activity Bar
2. Or `Cmd+Shift+P` → "Claude Code Explorer: Open Settings Explorer"

### Open Files

Click a file in the tree view to open it in the editor.

### Create Slash Command

1. Click the `+` icon in the Slash Commands view title bar
2. Select scope (Project/User)
3. Enter command name
4. (Optional) Enter namespace

### Create CLAUDE.md

`Cmd+Shift+P` → "Claude Code Explorer: Create CLAUDE.md"

## Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `ccexp.showHiddenFiles` | Show hidden files | `false` |
| `ccexp.scanRecursively` | Recursively scan subdirectories | `true` |
| `ccexp.autoRefresh` | Auto refresh on file changes | `true` |
| `ccexp.viewMode` | Show files in `flat` or `tree` layout inside each Project/User group | `flat` |

## Supported Files

| Type | Project | User |
|------|---------|------|
| CLAUDE.md | `./CLAUDE.md`, `./CLAUDE.local.md`, `.claude/**/CLAUDE.md`, `.claude/**/CLAUDE.local.md` | `~/.claude/CLAUDE.md` |
| Slash Commands | `.claude/commands/**/*.md` | `~/.claude/commands/**/*.md` |
| Skills | `.claude/skills/**/SKILL.md` | `~/.claude/skills/**/SKILL.md` |
| Sub-Agents | `.claude/agents/**/*.md` | `~/.claude/agents/**/*.md` |
| Settings | `.claude/settings.json` | `~/.claude/settings.json`, `~/.claude.json` |

## Why Use Claude Code Explorer?

If you're using **Claude Code** (Anthropic's AI coding assistant), this extension makes it easy to:
- **Discover** all your Claude Code configuration files in one place
- **Organize** slash commands by namespace
- **Browse** skills alongside commands, agents, and settings
- **Manage** sub-agents and their configurations
- **Edit** CLAUDE.md files without navigating complex directory structures
- **Create** new commands and configurations with guided wizards

Perfect for developers who want to maximize their productivity with Claude Code!

## Requirements

- VSCode 1.85.0 or later
- [Claude Code](https://claude.ai/download) installed (recommended)

## Acknowledgments

This extension was inspired by and built to provide the same functionality as the excellent [ccexp](https://github.com/nyatinte/ccexp) CLI tool created by [@nyatinte](https://github.com/nyatinte). We are grateful for the original work that made this VSCode extension possible.

## Related Links

- [Claude Code Official Documentation](https://docs.anthropic.com/en/docs/claude-code)
- [ccexp (CLI version)](https://github.com/nyatinte/ccexp) - Original CLI tool by [@nyatinte](https://github.com/nyatinte)
- [Report Issues](https://github.com/safeekow/ccexp_vc/issues)

## License

MIT License - See [LICENSE](LICENSE.txt) for details.
