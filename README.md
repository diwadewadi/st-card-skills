# st-card-skills

SillyTavern character card & world book CLI tool + AI coding assistant skills.

Supports **Claude Code**, **Codex**, and **Gemini CLI**.

## Install

```bash
npm install -g st-card-skills@latest
```

This gives you two commands:
- `st-card-tools` — CLI tool for reading/writing character cards and world books
- `st-card-skills` — Install skill files for your AI coding assistant

## Quick Start

```bash
# Install skill files (interactive runtime selector)
st-card-skills

# Configure SillyTavern path
st-card-tools init-config --st-root "/path/to/SillyTavern" --workspace "./workspace"

# Or use the setup wizard in Claude Code
/st:setup
```

## CLI Tool (st-card-tools)

```bash
st-card-tools list-cards          # List character cards
st-card-tools read-card <name>    # Read card JSON
st-card-tools extract-card <name> # Extract card to workspace
st-card-tools apply-card <name>   # Apply workspace back to PNG
st-card-tools list-worlds         # List world books
st-card-tools read-world <name>   # Read world book entries
st-card-tools extract-world <name> # Extract world to workspace
st-card-tools apply-world <name>  # Apply workspace back to JSON
```

## Skills Installer (st-card-skills)

```bash
# Install for a specific runtime
st-card-skills --claude
st-card-skills --codex
st-card-skills --gemini
st-card-skills --all

# Uninstall
st-card-skills --uninstall --claude
```

| Runtime | Install Location |
|---------|-----------------|
| Claude Code | `~/.claude/commands/st/` |
| Codex | `~/.codex/skills/st-*/` |
| Gemini CLI | `~/.gemini/commands/st/` |

## Available Skills

| Skill | Description |
|-------|-------------|
| `/st:setup` | Configure SillyTavern path and workspace |
| `/st:help` | Show all available commands and usage |

## License

MIT
