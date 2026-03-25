# st-card-skills

AI coding assistant skills for SillyTavern character card and world book editing.

Supports **Claude Code**, **Codex**, and **Gemini CLI**.

## Install

```bash
npx st-card-skills@latest
```

An interactive menu will let you choose which runtime(s) to install for.

### CLI flags

```bash
# Install for a specific runtime
npx st-card-skills --claude
npx st-card-skills --codex
npx st-card-skills --gemini

# Install for all runtimes
npx st-card-skills --all

# Uninstall
npx st-card-skills --uninstall --claude
npx st-card-skills --uninstall --all
```

### Install locations

| Runtime | Directory |
|---------|-----------|
| Claude Code | `~/.claude/commands/st/` |
| Codex | `~/.codex/skills/st-*/` |
| Gemini CLI | `~/.gemini/commands/st/` |

## Available Skills

| Skill | Description |
|-------|-------------|
| `/st:setup` | Install st-card-tools CLI and configure SillyTavern path |
| `/st:help` | Show all available commands and usage |

## Requires

- [st-card-tools](https://www.npmjs.com/package/st-card-tools) — CLI tool (installed via `/st:setup`)

## License

MIT
