#!/usr/bin/env node
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { spawnSync } from "node:child_process";

import {
  readCardFromPng,
  writeCardToPng,
  listCards,
  getCardField,
  setCardField,
  extractCardToWorkspace,
  applyCardFromWorkspace,
} from "./card-parser.js";
import {
  readWorld,
  writeWorld,
  listWorlds,
  getWorldEntry,
  getWorldEntrySummaries,
  setWorldEntry,
  deleteWorldEntry,
  extractWorldToWorkspace,
  applyWorldFromWorkspace,
} from "./world-parser.js";
import { verifyLive } from "./verify-live.js";

// ---- Arg parsing ----

const argv = process.argv.slice(2);

function getFlag(name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return undefined;
  return argv[i + 1];
}

// ---- Config file ----

const CONFIG_FILE = ".st-card-tools.json";

interface Config {
  "st-root"?: string;
  "st-url"?: string;
  workspace?: string;
}

function getConfigPath(): string {
  return path.join(os.homedir(), CONFIG_FILE);
}

function loadConfig(): Config {
  const configPath = getConfigPath();
  try {
    const raw = fs.readFileSync(configPath, "utf8");
    return JSON.parse(raw) as Config;
  } catch {
    return {};
  }
}

function saveConfig(config: Config): string {
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n");
  return configPath;
}

// ---- Resolve paths (CLI flag > env var > config file > default) ----

const config = loadConfig();
const stRoot = getFlag("st-root") || process.env.ST_ROOT || config["st-root"] || "";
const stUrl = getFlag("st-url") || process.env.ST_URL || config["st-url"] || "http://127.0.0.1:8000/";
let cardsDir = getFlag("cards") || process.env.ST_CARDS_DIR || "";
let worldsDir = getFlag("worlds") || process.env.ST_WORLDS_DIR || "";
let workspaceDir = path.resolve(getFlag("workspace") || config.workspace || path.join(process.cwd(), "workspace"));
const browserChannel = getFlag("browser") || process.env.ST_BROWSER || "msedge";

if (stRoot && !cardsDir) {
  cardsDir = path.join(stRoot, "data", "default-user", "characters");
}
if (stRoot && !worldsDir) {
  worldsDir = path.join(stRoot, "data", "default-user", "worlds");
}

function resolveCardPath(nameOrPath: string): string {
  if (path.isAbsolute(nameOrPath) || nameOrPath.includes("/") || nameOrPath.includes("\\")) {
    return nameOrPath;
  }
  if (!cardsDir) {
    console.error("Error: No --st-root or --cards configured. Provide a full path.");
    process.exit(1);
  }
  // Auto-append .png if missing
  const name = nameOrPath.toLowerCase().endsWith(".png") ? nameOrPath : nameOrPath + ".png";
  return path.join(cardsDir, name);
}

function resolveWorldPath(nameOrPath: string): string {
  if (path.isAbsolute(nameOrPath) || nameOrPath.includes("/") || nameOrPath.includes("\\")) {
    return nameOrPath;
  }
  if (!worldsDir) {
    console.error("Error: No --st-root or --worlds configured. Provide a full path.");
    process.exit(1);
  }
  // Auto-append .json if missing
  const name = nameOrPath.toLowerCase().endsWith(".json") ? nameOrPath : nameOrPath + ".json";
  return path.join(worldsDir, name);
}

// ---- Filter out flags from positional args ----
const positional: string[] = [];
const flagNames = new Set([
  "st-root",
  "st-url",
  "cards",
  "worlds",
  "workspace",
  "dir",
  "output",
  "module",
  "browser",
  "user-data-dir",
  "timeout",
]);
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith("--")) {
    const name = argv[i].slice(2);
    if (flagNames.has(name)) {
      i++; // skip value
    }
    continue;
  }
  positional.push(argv[i]);
}

const command = positional[0];
const args = positional.slice(1);

type CheckStatus = "ok" | "warn" | "error";

interface DoctorCheck {
  label: string;
  status: CheckStatus;
  detail: string;
}

interface RuntimeStatus {
  label: string;
  targetDir: string;
  installedItems: string[];
}

function existsDirectory(targetPath: string): boolean {
  try {
    return fs.statSync(targetPath).isDirectory();
  } catch {
    return false;
  }
}

function findExecutable(candidates: string[]): string | undefined {
  const locator = process.platform === "win32" ? "where.exe" : "which";

  for (const candidate of candidates) {
    const result = spawnSync(locator, [candidate], { encoding: "utf8" });
    if (result.status === 0) {
      const firstMatch = result.stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .find(Boolean);
      if (firstMatch) {
        return firstMatch;
      }
    }
  }

  return undefined;
}

function browserCandidates(channel: string): string[] {
  const candidates = new Set<string>();

  const add = (...names: string[]) => {
    for (const name of names) candidates.add(name);
  };

  switch (channel) {
    case "msedge":
      add("msedge", "msedge.exe", "microsoft-edge", "microsoft-edge-stable");
      break;
    case "chrome":
      add("chrome", "chrome.exe", "google-chrome", "google-chrome-stable");
      break;
    case "chromium":
      add("chromium", "chromium.exe", "chromium-browser");
      break;
    case "firefox":
      add("firefox", "firefox.exe");
      break;
    default:
      add(channel, `${channel}.exe`);
      break;
  }

  return [...candidates];
}

function getRuntimeStatuses(): RuntimeStatus[] {
  const runtimes = [
    {
      label: "Claude Code",
      targetDir: path.join(process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude"), "commands", "st"),
      listItems: (dir: string) => fs.readdirSync(dir).filter((name) => name.endsWith(".md")).sort(),
    },
    {
      label: "Codex",
      targetDir: path.join(process.env.CODEX_HOME || path.join(os.homedir(), ".codex"), "skills"),
      listItems: (dir: string) =>
        fs.readdirSync(dir, { withFileTypes: true })
          .filter((entry) => entry.isDirectory() && entry.name.startsWith("st-"))
          .map((entry) => entry.name)
          .sort(),
    },
    {
      label: "Gemini CLI",
      targetDir: path.join(process.env.GEMINI_CONFIG_DIR || path.join(os.homedir(), ".gemini"), "commands", "st"),
      listItems: (dir: string) => fs.readdirSync(dir).filter((name) => name.endsWith(".md")).sort(),
    },
  ];

  return runtimes.map((runtime) => ({
    label: runtime.label,
    targetDir: runtime.targetDir,
    installedItems: existsDirectory(runtime.targetDir) ? runtime.listItems(runtime.targetDir) : [],
  }));
}

function runDoctor(): number {
  const checks: DoctorCheck[] = [];
  const configPath = getConfigPath();

  checks.push({
    label: "Config file",
    status: fs.existsSync(configPath) ? "ok" : "warn",
    detail: fs.existsSync(configPath)
      ? `Found at ${configPath}`
      : `Not found. Run 'st-card-tools init-config --st-root "<path>" --workspace "<path>"' to save defaults.`,
  });

  if (!stRoot) {
    checks.push({
      label: "SillyTavern root",
      status: "warn",
      detail: "Not configured. Set --st-root, ST_ROOT, or save it with init-config.",
    });
  } else if (!existsDirectory(stRoot)) {
    checks.push({
      label: "SillyTavern root",
      status: "error",
      detail: `Configured path does not exist: ${stRoot}`,
    });
  } else {
    const charactersOk = existsDirectory(cardsDir);
    const worldsOk = existsDirectory(worldsDir);
    const status: CheckStatus = charactersOk && worldsOk ? "ok" : "error";
    const detail = [
      `Root: ${stRoot}`,
      `characters: ${charactersOk ? cardsDir : `missing (${cardsDir || "not resolved"})`}`,
      `worlds: ${worldsOk ? worldsDir : `missing (${worldsDir || "not resolved"})`}`,
    ].join(" | ");
    checks.push({ label: "SillyTavern root", status, detail });
  }

  if (existsDirectory(workspaceDir)) {
    checks.push({
      label: "Workspace",
      status: "ok",
      detail: `Ready at ${workspaceDir}`,
    });
  } else if (existsDirectory(path.dirname(workspaceDir))) {
    checks.push({
      label: "Workspace",
      status: "warn",
      detail: `Directory does not exist yet: ${workspaceDir}. It will be created by 'st-card-tools init' or the first extract.`,
    });
  } else {
    checks.push({
      label: "Workspace",
      status: "error",
      detail: `Parent directory does not exist: ${path.dirname(workspaceDir)}`,
    });
  }

  const browserPath = findExecutable(browserCandidates(browserChannel));
  checks.push({
    label: "Browser",
    status: browserPath ? "ok" : "warn",
    detail: browserPath
      ? `verify-live browser channel "${browserChannel}" looks available at ${browserPath}`
      : `Could not find an executable for browser channel "${browserChannel}" on PATH. Try --browser chrome or install Microsoft Edge/Chrome locally.`,
  });

  const runtimeStatuses = getRuntimeStatuses();
  for (const runtime of runtimeStatuses) {
    checks.push({
      label: `Skills (${runtime.label})`,
      status: runtime.installedItems.length > 0 ? "ok" : "warn",
      detail: runtime.installedItems.length > 0
        ? `${runtime.installedItems.length} skill item(s) installed in ${runtime.targetDir}`
        : `No st-card-skills files found in ${runtime.targetDir}`,
    });
  }

  console.log("st-card-tools doctor\n");
  for (const check of checks) {
    const icon = check.status === "ok" ? "OK" : check.status === "warn" ? "WARN" : "ERROR";
    console.log(`[${icon}] ${check.label}: ${check.detail}`);
  }

  const hasError = checks.some((check) => check.status === "error");
  if (!hasError) {
    console.log("\nDoctor completed without blocking errors.");
  }

  return hasError ? 1 : 0;
}

// ---- Commands ----

function printHelp() {
  console.log(`st-card-tools - SillyTavern character card & world book CLI

Usage: st-card-tools <command> [args] [options]

Commands:
  doctor                          Check st-root, workspace, browser, and installed skills
  init-config                     Save st-root, st-url, and workspace to ~/.st-card-tools.json
  init                            Initialize workspace directory
  list-cards                      List character card PNG files
  read-card <name>                Read full card JSON from PNG
  read-card-field <name> <field>  Read a field (dot notation)
  write-card-field <name> <field> <value>  Modify a field
  extract-card <name>             Extract card to workspace
  apply-card <name>               Apply workspace card back to PNG
  verify-live <name>              Open real SillyTavern in a browser and stream console logs
  list-worlds                     List world book JSON files
  read-world <name>               Read world book entry summaries
  read-world-entry <name> <id>    Read full entry content
  extract-world <name>            Extract world book to workspace
  apply-world <name>              Apply workspace world back to JSON

Options:
  --st-root <path>    SillyTavern root directory (or ST_ROOT env)
  --st-url <url>      SillyTavern browser URL (or ST_URL env; default: http://127.0.0.1:8000/)
  --cards <path>      Override characters directory
  --worlds <path>     Override worlds directory
  --workspace <path>  Workspace directory (default: cwd/workspace)
  --dir <path>        Override directory for list commands
  --output <path>     Override output path for apply commands
  --module <name>     Module label used by verify-live instructions/logs
  --browser <name>    Browser channel for verify-live (default: msedge)
  --user-data-dir <path>  Persistent browser profile for verify-live
  --timeout <ms>      Navigation timeout for verify-live (default: 15000)
  --help              Show this help

Common tasks:
  1. First-time environment check
     st-card-tools doctor

  2. Save your SillyTavern path and workspace once
     st-card-tools init-config --st-root "/path/to/SillyTavern" --workspace "./workspace"

  3. Extract a card, edit files in workspace, then write it back
     st-card-tools extract-card Alice
     st-card-tools apply-card Alice

  4. Read or update one field without extracting the whole card
     st-card-tools read-card-field Alice data.description
     st-card-tools write-card-field Alice data.description "New description"

  5. Debug a frontend module in a real browser
     st-card-tools verify-live Alice --module statusbar --browser msedge`);
}

async function main() {
  try {
    switch (command) {
      case undefined:
      case "--help":
      case "help": {
        printHelp();
        break;
      }

      case "doctor": {
        process.exitCode = runDoctor();
        break;
      }

      case "init-config": {
        const newConfig: Config = { ...config };
        if (stRoot) newConfig["st-root"] = stRoot;
        if (getFlag("st-url")) newConfig["st-url"] = getFlag("st-url")!;
        if (getFlag("workspace")) newConfig.workspace = getFlag("workspace")!;
        const saved = saveConfig(newConfig);
        console.log(`Config saved to ${saved}`);
        console.log(JSON.stringify(newConfig, null, 2));
        break;
      }

      case "init": {
        workspaceDir = path.resolve(getFlag("workspace") || workspaceDir);
        fs.mkdirSync(workspaceDir, { recursive: true });
        console.log(`Workspace initialized at: ${workspaceDir}`);
        break;
      }

      case "list-cards": {
        const dir = getFlag("dir") || cardsDir;
        if (!dir) { console.error("Error: No cards directory. Use --st-root or --dir."); process.exit(1); }
        console.log(JSON.stringify(listCards(dir), null, 2));
        break;
      }

      case "read-card": {
        if (!args[0]) { console.error("Usage: st-card-tools read-card <name>"); process.exit(1); }
        const card = readCardFromPng(resolveCardPath(args[0]));
        console.log(JSON.stringify(card, null, 2));
        break;
      }

      case "read-card-field": {
        if (!args[0] || !args[1]) { console.error("Usage: st-card-tools read-card-field <name> <field>"); process.exit(1); }
        const card = readCardFromPng(resolveCardPath(args[0]));
        const value = getCardField(card, args[1]);
        if (value === undefined) { console.error(`Error: Field "${args[1]}" not found`); process.exit(1); }
        console.log(typeof value === "string" ? value : JSON.stringify(value, null, 2));
        break;
      }

      case "write-card-field": {
        if (!args[0] || !args[1] || args[2] === undefined) {
          console.error("Usage: st-card-tools write-card-field <name> <field> <value>"); process.exit(1);
        }
        const cardPath = resolveCardPath(args[0]);
        const card = readCardFromPng(cardPath);
        let value: unknown = args[2];
        try { value = JSON.parse(args[2]); } catch { /* keep as string */ }
        setCardField(card, args[1], value);
        writeCardToPng(cardPath, card);
        console.log(`Field "${args[1]}" updated in ${cardPath}`);
        break;
      }

      case "extract-card": {
        if (!args[0]) { console.error("Usage: st-card-tools extract-card <name>"); process.exit(1); }
        const result = extractCardToWorkspace(resolveCardPath(args[0]), workspaceDir, worldsDir || undefined);
        const parts = [
          `Card extracted:\n  card.json: ${result.cardJsonPath}\n  avatar: ${result.avatarPath}\n  manifest: ${result.manifestPath}`,
        ];
        if (result.greetingFiles.length > 0) parts.push(`  greetings: ${result.greetingFiles.join(", ")}`);
        if (result.regexFiles.length > 0) parts.push(`  regex: ${result.regexFiles.join(", ")}`);
        if (result.scriptFiles.length > 0) parts.push(`  scripts: ${result.scriptFiles.join(", ")}`);
        if (result.worldDir) parts.push(`  world: ${result.worldDir}`);
        console.log(parts.join("\n"));
        break;
      }

      case "apply-card": {
        if (!args[0]) { console.error("Usage: st-card-tools apply-card <name>"); process.exit(1); }
        const cardDir = path.join(workspaceDir, "cards", args[0]);
        const target = applyCardFromWorkspace(cardDir, getFlag("output"));
        console.log(`Card applied to ${target}`);
        break;
      }

      case "verify-live": {
        if (!args[0]) {
          console.error("Usage: st-card-tools verify-live <name> [--module <name>] [--st-url <url>]");
          process.exit(1);
        }

        const cardDir = path.join(workspaceDir, "cards", args[0]);
        const userDataDir = path.resolve(
          getFlag("user-data-dir") || path.join(workspaceDir, ".st-card-tools", "verify-live-profile"),
        );

        await verifyLive({
          cardName: args[0],
          moduleName: getFlag("module"),
          stUrl,
          browserChannel,
          userDataDir,
          timeoutMs: Number(getFlag("timeout") || 15000),
          logDir: path.join(cardDir, "logs", "verify-live"),
        });
        break;
      }

      case "list-worlds": {
        const dir = getFlag("dir") || worldsDir;
        if (!dir) { console.error("Error: No worlds directory. Use --st-root or --dir."); process.exit(1); }
        console.log(JSON.stringify(listWorlds(dir), null, 2));
        break;
      }

      case "read-world": {
        if (!args[0]) { console.error("Usage: st-card-tools read-world <name>"); process.exit(1); }
        const world = readWorld(resolveWorldPath(args[0]));
        console.log(JSON.stringify(getWorldEntrySummaries(world), null, 2));
        break;
      }

      case "read-world-entry": {
        if (!args[0] || !args[1]) { console.error("Usage: st-card-tools read-world-entry <name> <id>"); process.exit(1); }
        const world = readWorld(resolveWorldPath(args[0]));
        const entry = getWorldEntry(world, args[1]);
        if (!entry) { console.error(`Error: Entry "${args[1]}" not found`); process.exit(1); }
        console.log(JSON.stringify(entry, null, 2));
        break;
      }

      case "extract-world": {
        if (!args[0]) { console.error("Usage: st-card-tools extract-world <name>"); process.exit(1); }
        const result = extractWorldToWorkspace(resolveWorldPath(args[0]), workspaceDir);
        const fileList = ["_meta.json", "_manifest.json", ...result.entryFiles].join(", ");
        console.log(
          `World extracted:\n  Directory: ${result.outDir}\n  Files: ${fileList}`,
        );
        break;
      }

      case "apply-world": {
        if (!args[0]) { console.error("Usage: st-card-tools apply-world <name>"); process.exit(1); }
        const worldDir = path.join(workspaceDir, "worlds", args[0]);
        const target = applyWorldFromWorkspace(worldDir, getFlag("output"));
        console.log(`World applied to ${target}`);
        break;
      }

      default: {
        console.error(`Unknown command: ${command}\nRun 'st-card-tools --help' for usage.`);
        process.exit(1);
      }
    }
  } catch (e: unknown) {
    console.error(`Error: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }
}

await main();
