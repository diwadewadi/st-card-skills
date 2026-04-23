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
# Check your environment
st-card-tools doctor

# Install skill files (interactive runtime selector)
st-card-skills

# Configure SillyTavern path
st-card-tools init-config --st-root "/path/to/SillyTavern" --workspace "./workspace"

# Or use the setup wizard in Claude Code
/st:setup

# In Codex, invoke the installed skill by name
$st-setup
```

## CLI Tool (st-card-tools)

```bash
st-card-tools doctor             # Check st-root, workspace, browser, and installed skills
st-card-tools list-cards          # List character cards
st-card-tools read-card <name>    # Read card JSON
st-card-tools extract-card <name> # Extract card + greetings + regex scripts + world book to workspace
st-card-tools apply-card <name>   # Apply workspace back to PNG + world book
st-card-tools verify-live <name>  # Open real SillyTavern and stream browser console logs
st-card-tools list-worlds         # List world books
st-card-tools read-world <name>   # Read world book entries
st-card-tools extract-world <name> # Extract world to workspace (entry .json + -content.txt)
st-card-tools apply-world <name>  # Apply workspace back to JSON
```

`verify-live` is intended for frontend debugging. It launches a real browser against your running SillyTavern instance, then mirrors browser `console`, page errors, and failed requests back into the terminal and a workspace log file.

`doctor` checks your effective `st-root`, workspace, verify-live browser channel, and whether st-card-skills are installed for Claude Code, Codex, and Gemini CLI.

`extract-card` and `extract-world` now write `_manifest.json` files so both humans and AI agents can see the extracted workspace structure and companion files at a glance.

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

Codex skill names use hyphens, for example:
- `$st-setup`
- `$st-help`
- `$st-quick_start`
- `$st-mvu`
- `$st-image`

## Available Skills

| Skill | Description |
|-------|-------------|
| `/st:setup` | Configure SillyTavern path and workspace |
| `/st:help` | Show all available commands and usage |
| `/st:quick_start` | Learn tools & ask what user wants to do |
| `/st:conventions` | Reference coding conventions and best practices for SillyTavern card development |
| `/st:frontend` | Create Vue 3 interactive frontends for a character card |
| `/st:script` | Create TavernHelper scripts for a character card |
| `/st:mvu` | Add or modify MVU variable system and frontend |
| `/st:image` | Add image insertion system to a character card |

Codex uses the same skills with these invocation names:
- `st-setup`
- `st-help`
- `st-quick_start`
- `st-conventions`
- `st-frontend`
- `st-script`
- `st-mvu`
- `st-image`

## MVU Variable System

`/st:mvu` helps you add the [MVU (MagVarUpdate)](https://github.com/MagicalAstrogy/MagVarUpdate) variable framework to any character card, or modify an existing one. It generates:

- **Zod schema script** — Type-safe variable structure with validation and constraints
- **MVU runtime script** — The MVU engine import
- **5 world book entries** — Variable list, update rules, output format, format reminder, initialization
- **6 regex scripts** — Hide/beautify variable update blocks, remove placeholders from prompts
- **Frontend status bar** (optional) — Real-time variable display with tab layout

Templates are bundled in `templates/mvu/` (world book metadata, regex configs, beautification HTML).

## Image Insertion System

`/st:image` helps you add an image insertion system to any character card. It works by:

1. **World book entries** tell the AI what images are available (directory of categories with numbered ranges)
2. **AI outputs path tags** like `[img_sfw:SFW/人物微笑/3.jpg]` in its responses
3. **Regex scripts** replace those tags with `<img>` HTML tags, loading images from your hosting URL

Features:
- **Custom hosting** — Works with any image host (GitGud, GitHub, S3, self-hosted, etc.)
- **Two modes** — Inline narrative images and structured data images (forum posts, chat messages, etc.)

Templates are bundled in `templates/image/` (world book metadata, regex configs, img rendering HTML).

## License

MIT
