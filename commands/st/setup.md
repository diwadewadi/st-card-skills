---
name: st:setup
description: Install st-card-tools CLI and configure SillyTavern path and workspace
---

<objective>
Guide the user through installing the st-card-tools CLI tool, configuring their SillyTavern path and workspace directory. Act as an installation wizard.
</objective>

<process>
Follow these steps in order:

1. **Check Node.js**: Run `node --version` to verify Node.js is installed. If not, tell the user to install Node.js first from https://nodejs.org/

2. **Install st-card-tools**: Run `npm install -g st-card-tools@latest` to install or upgrade the CLI globally.

3. **Verify installation**: Run `st-card-tools --help` to confirm it works.

4. **Configure SillyTavern path**: Ask the user for their SillyTavern installation directory. Then verify it exists by checking if the path contains a `data/default-user/characters` folder.

5. **Configure workspace path**: Ask the user for their workspace directory (the directory where extracted cards and world books will be stored for editing). Default suggestion: `./workspace` under the current working directory.

6. **Save config**: Run `st-card-tools init-config --st-root "<user's ST path>" --workspace "<user's workspace path>"` to save both paths to `~/.st-card-tools.json`. This way the user never needs to pass `--st-root` or `--workspace` again.

7. **Test connection**: Run `st-card-tools list-cards` to verify everything works (no flags needed since config is saved).

8. **Summary**: Tell the user the setup is complete. Config is saved to `~/.st-card-tools.json` — no need to pass `--st-root` or `--workspace` on every command.

Show available commands:
```
st-card-tools list-cards          List character cards
st-card-tools read-card <name>    Read card JSON
st-card-tools extract-card <name> Extract card to workspace
st-card-tools apply-card <name>   Apply workspace back to PNG
st-card-tools list-worlds         List world books
st-card-tools read-world <name>   Read world book entries
st-card-tools extract-world <name> Extract world to workspace
st-card-tools apply-world <name>  Apply workspace back to JSON
```
</process>
