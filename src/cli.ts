#!/usr/bin/env node
import path from "node:path";
import fs from "node:fs";
import os from "node:os";

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
let cardsDir = getFlag("cards") || process.env.ST_CARDS_DIR || "";
let worldsDir = getFlag("worlds") || process.env.ST_WORLDS_DIR || "";
let workspaceDir = getFlag("workspace") || config.workspace || path.join(process.cwd(), "workspace");

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
const flagNames = new Set(["st-root", "cards", "worlds", "workspace", "dir", "output"]);
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

// ---- Commands ----

function printHelp() {
  console.log(`st-card-tools - SillyTavern character card & world book CLI

Usage: st-card-tools <command> [args] [options]

Commands:
  init-config                     Save st-root and workspace to ~/.st-card-tools.json
  init                            Initialize workspace directory
  list-cards                      List character card PNG files
  read-card <name>                Read full card JSON from PNG
  read-card-field <name> <field>  Read a field (dot notation)
  write-card-field <name> <field> <value>  Modify a field
  extract-card <name>             Extract card to workspace
  apply-card <name>               Apply workspace card back to PNG
  list-worlds                     List world book JSON files
  read-world <name>               Read world book entry summaries
  read-world-entry <name> <id>    Read full entry content
  extract-world <name>            Extract world book to workspace
  apply-world <name>              Apply workspace world back to JSON

Options:
  --st-root <path>    SillyTavern root directory (or ST_ROOT env)
  --cards <path>      Override characters directory
  --worlds <path>     Override worlds directory
  --workspace <path>  Workspace directory (default: cwd/workspace)
  --dir <path>        Override directory for list commands
  --output <path>     Override output path for apply commands
  --help              Show this help`);
}

try {
  switch (command) {
    case undefined:
    case "--help":
    case "help": {
      printHelp();
      break;
    }

    case "init-config": {
      const newConfig: Config = { ...config };
      if (stRoot) newConfig["st-root"] = stRoot;
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
      const parts = [`Card extracted:\n  card.json: ${result.cardJsonPath}\n  avatar: ${result.avatarPath}`];
      if (result.greetingFiles.length > 0) parts.push(`  greetings: ${result.greetingFiles.join(", ")}`);
      if (result.regexFiles.length > 0) parts.push(`  regex: ${result.regexFiles.join(", ")}`);
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
      console.log(`World extracted:\n  Directory: ${result.outDir}\n  Files: _meta.json, ${result.entryFiles.join(", ")}`);
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
