---
name: st:setup
description: Install st-card-tools CLI and configure SillyTavern path
---

<objective>
Guide the user through installing the st-card-tools CLI tool and configuring their SillyTavern path. Act as an installation wizard.
</objective>

<process>
Follow these steps in order:

1. **Check Node.js**: Run `node --version` to verify Node.js is installed. If not, tell the user to install Node.js first from https://nodejs.org/

2. **Install st-card-tools**: Run `npm install -g st-card-tools@latest` to install or upgrade the CLI globally.

3. **Verify installation**: Run `st-card-tools --help` to confirm it works.

4. **Configure SillyTavern path**: Ask the user for their SillyTavern installation directory. Then verify it exists by checking if the path contains a `data/default-user/characters` folder.

5. **Test connection**: Run `st-card-tools list-cards --st-root "<user's path>"` to verify everything works.

6. **Summary**: Tell the user the setup is complete. Remind them that all st-card-tools commands need `--st-root "<path>"` or they can set the `ST_ROOT` environment variable.

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
