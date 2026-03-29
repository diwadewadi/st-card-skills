#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

// Colors
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const yellow = '\x1b[33m';
const red = '\x1b[31m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

// Get version from package.json
const pkg = require('./package.json');

// Parse args
const args = process.argv.slice(2);
const hasClaude = args.includes('--claude');
const hasCodex = args.includes('--codex');
const hasGemini = args.includes('--gemini');
const hasAll = args.includes('--all');
const hasUninstall = args.includes('--uninstall') || args.includes('-u');

let selectedRuntimes = [];
if (hasAll) {
  selectedRuntimes = ['claude', 'codex', 'gemini'];
} else {
  if (hasClaude) selectedRuntimes.push('claude');
  if (hasCodex) selectedRuntimes.push('codex');
  if (hasGemini) selectedRuntimes.push('gemini');
}

// Runtime config
const RUNTIMES = {
  claude: {
    label: 'Claude Code',
    globalDir: () => {
      if (process.env.CLAUDE_CONFIG_DIR) return process.env.CLAUDE_CONFIG_DIR;
      return path.join(os.homedir(), '.claude');
    },
    commandsDir: (base) => path.join(base, 'commands', 'st'),
    format: 'claude',
  },
  codex: {
    label: 'Codex',
    globalDir: () => {
      if (process.env.CODEX_HOME) return process.env.CODEX_HOME;
      return path.join(os.homedir(), '.codex');
    },
    commandsDir: (base) => path.join(base, 'skills'),
    format: 'codex',
  },
  gemini: {
    label: 'Gemini CLI',
    globalDir: () => {
      if (process.env.GEMINI_CONFIG_DIR) return process.env.GEMINI_CONFIG_DIR;
      return path.join(os.homedir(), '.gemini');
    },
    commandsDir: (base) => path.join(base, 'commands', 'st'),
    format: 'claude', // Gemini uses same markdown command format
  },
};

// Source directory for command files
const sourceDir = path.join(__dirname, 'commands', 'st');

/**
 * Extract frontmatter and body from markdown content
 */
function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { frontmatter: null, body: content };
  return { frontmatter: match[1], body: match[2] };
}

/**
 * Extract a field value from YAML frontmatter
 */
function extractField(frontmatter, field) {
  if (!frontmatter) return null;
  const match = frontmatter.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
  return match ? match[1].trim() : null;
}

/**
 * Convert a Claude command .md to Codex SKILL.md format
 */
function convertToCodexSkill(content, skillName) {
  const { frontmatter, body } = extractFrontmatter(content);
  const name = extractField(frontmatter, 'name') || skillName;
  const description = extractField(frontmatter, 'description') || `st-card-tools skill: ${skillName}`;

  const adapter = `<codex_skill_adapter>
## Skill Invocation
- This skill is invoked by mentioning \`$${skillName}\`.
- Treat all user text after \`$${skillName}\` as arguments.
</codex_skill_adapter>`;

  return `---\nname: "${name}"\ndescription: "${description}"\n---\n\n${adapter}\n\n${body.trimStart()}`;
}

/**
 * Install commands for Claude/Gemini (same markdown format)
 */
function installMarkdownCommands(targetDir) {
  fs.mkdirSync(targetDir, { recursive: true });

  const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.md'));
  let count = 0;
  for (const file of files) {
    fs.copyFileSync(path.join(sourceDir, file), path.join(targetDir, file));
    console.log(`    ${green}+${reset} ${file}`);
    count++;
  }
  return count;
}

/**
 * Install commands as Codex skills (each command → its own directory with SKILL.md)
 */
function installCodexSkills(skillsDir) {
  fs.mkdirSync(skillsDir, { recursive: true });

  const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.md'));
  let count = 0;
  for (const file of files) {
    const baseName = file.replace('.md', '');
    const skillName = `st-${baseName}`;
    const skillDir = path.join(skillsDir, skillName);
    fs.mkdirSync(skillDir, { recursive: true });

    const content = fs.readFileSync(path.join(sourceDir, file), 'utf8');
    const converted = convertToCodexSkill(content, skillName);
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), converted);
    console.log(`    ${green}+${reset} ${skillName}/SKILL.md`);
    count++;
  }
  return count;
}

/**
 * Uninstall commands for Claude/Gemini
 */
function uninstallMarkdownCommands(targetDir) {
  if (!fs.existsSync(targetDir)) {
    console.log(`    ${dim}Nothing to remove${reset}`);
    return 0;
  }
  const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    fs.unlinkSync(path.join(targetDir, file));
    console.log(`    ${red}-${reset} ${file}`);
  }
  // Remove the st/ directory if empty
  try {
    const remaining = fs.readdirSync(targetDir);
    if (remaining.length === 0) fs.rmdirSync(targetDir);
  } catch {}
  return files.length;
}

/**
 * Uninstall Codex skills
 */
function uninstallCodexSkills(skillsDir) {
  if (!fs.existsSync(skillsDir)) {
    console.log(`    ${dim}Nothing to remove${reset}`);
    return 0;
  }
  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  let count = 0;
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith('st-')) {
      fs.rmSync(path.join(skillsDir, entry.name), { recursive: true });
      console.log(`    ${red}-${reset} ${entry.name}/`);
      count++;
    }
  }
  return count;
}

/**
 * Install for a single runtime
 */
function install(runtime) {
  const config = RUNTIMES[runtime];
  const baseDir = config.globalDir();
  const targetDir = config.commandsDir(baseDir);
  const displayPath = baseDir.replace(os.homedir(), '~');

  console.log(`\n  ${cyan}${config.label}${reset} ${dim}(${displayPath})${reset}`);

  let count;
  if (config.format === 'codex') {
    count = installCodexSkills(targetDir);
  } else {
    count = installMarkdownCommands(targetDir);
  }

  console.log(`  ${green}✓${reset} ${count} skills installed\n`);
}

/**
 * Uninstall for a single runtime
 */
function uninstall(runtime) {
  const config = RUNTIMES[runtime];
  const baseDir = config.globalDir();
  const targetDir = config.commandsDir(baseDir);
  const displayPath = baseDir.replace(os.homedir(), '~');

  console.log(`\n  ${cyan}${config.label}${reset} ${dim}(${displayPath})${reset}`);

  let count;
  if (config.format === 'codex') {
    count = uninstallCodexSkills(targetDir);
  } else {
    count = uninstallMarkdownCommands(targetDir);
  }

  if (count > 0) {
    console.log(`  ${green}✓${reset} ${count} skills removed\n`);
  } else {
    console.log('');
  }
}

/**
 * Interactive runtime selection prompt
 */
function promptRuntime(callback) {
  if (!process.stdin.isTTY) {
    // Non-interactive: default to claude
    console.log(`  ${yellow}Non-interactive terminal, defaulting to Claude Code${reset}\n`);
    callback(['claude']);
    return;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let answered = false;

  rl.on('close', () => {
    if (!answered) {
      answered = true;
      console.log(`\n  ${yellow}Installation cancelled${reset}\n`);
      process.exit(0);
    }
  });

  console.log(`  ${yellow}Which runtime(s) would you like to install for?${reset}\n
  ${cyan}1${reset}) Claude Code  ${dim}(~/.claude)${reset}
  ${cyan}2${reset}) Codex        ${dim}(~/.codex)${reset}
  ${cyan}3${reset}) Gemini CLI   ${dim}(~/.gemini)${reset}
  ${cyan}4${reset}) All

  ${dim}Select multiple: 1,3 or 1 3${reset}
`);

  const runtimeMap = { '1': 'claude', '2': 'codex', '3': 'gemini' };
  const allRuntimes = ['claude', 'codex', 'gemini'];

  rl.question(`  Choice ${dim}[1]${reset}: `, (answer) => {
    answered = true;
    rl.close();
    const input = answer.trim() || '1';

    if (input === '4') {
      callback(allRuntimes);
      return;
    }

    const choices = input.split(/[\s,]+/).filter(Boolean);
    const selected = [];
    for (const c of choices) {
      const runtime = runtimeMap[c];
      if (runtime && !selected.includes(runtime)) {
        selected.push(runtime);
      }
    }

    callback(selected.length > 0 ? selected : ['claude']);
  });
}

/**
 * Run install or uninstall for all selected runtimes
 */
function run(runtimes) {
  const action = hasUninstall ? 'Uninstalling' : 'Installing';
  console.log(`\n  ${action} st-card-skills...`);

  for (const runtime of runtimes) {
    if (hasUninstall) {
      uninstall(runtime);
    } else {
      install(runtime);
    }
  }

  if (!hasUninstall) {
    console.log(`  ${dim}Restart your coding tool to use /st:setup and /st:help${reset}\n`);
  }
}

// Main
console.log(`\n  ${cyan}st-card-skills${reset} ${dim}v${pkg.version}${reset}\n`);

if (selectedRuntimes.length > 0) {
  run(selectedRuntimes);
} else {
  promptRuntime(run);
}
