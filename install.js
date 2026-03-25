#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const homeDir = os.homedir();
const targetDir = path.join(homeDir, ".claude", "commands", "st");
const sourceDir = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "commands", "st");

console.log("st-card-skills installer");
console.log("========================\n");

// Create target directory
fs.mkdirSync(targetDir, { recursive: true });
console.log(`Target: ${targetDir}`);

// Copy command files
const files = fs.readdirSync(sourceDir).filter(f => f.endsWith(".md"));
for (const file of files) {
  const src = path.join(sourceDir, file);
  const dest = path.join(targetDir, file);
  fs.copyFileSync(src, dest);
  console.log(`  Installed: ${file}`);
}

console.log(`\nDone! ${files.length} skills installed.`);
console.log("Restart Claude Code to use /st:setup and /st:help");
