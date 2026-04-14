---
name: st:setup
description: Configure SillyTavern path and workspace for st-card-tools
---

<objective>
Guide the user through configuring their SillyTavern path and workspace directory. The st-card-tools CLI is already bundled with this package — no separate install needed.
</objective>

<process>
Follow these steps in order:

1. **Verify CLI available**: Run `st-card-tools --help` to confirm it works. If not found, tell the user to run `npm install -g st-card-skills@latest` first.

2. **Configure SillyTavern path**: Ask the user for their SillyTavern installation directory. Then verify it exists by checking if the path contains a `data/default-user/characters` folder.

3. **Configure workspace path**: Ask the user for their workspace directory (the directory where extracted cards and world books will be stored for editing). Default suggestion: `./workspace` under the current working directory.

4. **Save config**: Run `st-card-tools init-config --st-root "<user's ST path>" --workspace "<user's workspace path>"` to save both paths to `~/.st-card-tools.json`. This way the user never needs to pass `--st-root` or `--workspace` again.

5. **Run doctor**: Run `st-card-tools doctor` to verify the effective st-root, workspace, browser, and skills install status.

6. **Test connection**: Run `st-card-tools list-cards` to verify everything works (no flags needed since config is saved).

7. **Summary**: Tell the user the setup is complete. Config is saved to `~/.st-card-tools.json` — no need to pass `--st-root` or `--workspace` on every command.

Show available commands:
```
st-card-tools doctor             Check environment and installed skills
st-card-tools list-cards          List character cards
st-card-tools read-card <name>    Read card JSON
st-card-tools extract-card <name> Extract card + greetings + world book to workspace
st-card-tools apply-card <name>   Apply workspace back to PNG + world book
st-card-tools list-worlds         List world books
st-card-tools read-world <name>   Read world book entries
st-card-tools extract-world <name> Extract world to workspace (entry .json + -content.txt)
st-card-tools apply-world <name>  Apply workspace back to JSON
```
</process>
