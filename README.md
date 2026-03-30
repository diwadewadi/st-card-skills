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
st-card-tools extract-card <name> # Extract card + greetings + regex scripts + world book to workspace
st-card-tools apply-card <name>   # Apply workspace back to PNG + world book
st-card-tools list-worlds         # List world books
st-card-tools read-world <name>   # Read world book entries
st-card-tools extract-world <name> # Extract world to workspace (entry .json + -content.txt)
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
| `/st:quick_start` | Learn tools & ask what user wants to do |
| `/st:mvu` | Add or modify MVU variable system and frontend |

## MVU Variable System

`/st:mvu` helps you add the [MVU (MagVarUpdate)](https://github.com/MagicalAstrogy/MagVarUpdate) variable framework to any character card, or modify an existing one. It generates:

- **Zod schema script** — Type-safe variable structure with validation and constraints
- **MVU runtime script** — The MVU engine import
- **5 world book entries** — Variable list, update rules, output format, format reminder, initialization
- **6 regex scripts** — Hide/beautify variable update blocks, remove placeholders from prompts
- **Frontend status bar** (optional) — Real-time variable display with tab layout

Templates are bundled in `templates/mvu/` (world book metadata, regex configs, beautification HTML).

## License

MIT
