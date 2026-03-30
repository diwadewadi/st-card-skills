#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { Buffer } from "node:buffer";
import { createRequire } from "node:module";
import { extractWorldToWorkspace, applyWorldFromWorkspace } from "./world-parser.js";

const require = createRequire(import.meta.url);
const extract = require("png-chunks-extract");
const PNGtext = require("png-chunk-text");

// Inline PNG chunk encoder (ported from SillyTavern's png/encode.js)
function encodePngChunks(
  chunks: Array<{ name: string; data: Uint8Array }>
): Uint8Array {
  const { crc32 } = require("crc");

  const uint8 = new Uint8Array(4);
  const int32 = new Int32Array(uint8.buffer);
  const uint32 = new Uint32Array(uint8.buffer);

  let totalSize = 8;
  for (const chunk of chunks) {
    totalSize += chunk.data.length + 12;
  }

  const output = new Uint8Array(totalSize);
  // PNG signature
  output.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);

  let idx = 8;
  for (const { name, data } of chunks) {
    const size = data.length;
    uint32[0] = size;
    output[idx++] = uint8[3];
    output[idx++] = uint8[2];
    output[idx++] = uint8[1];
    output[idx++] = uint8[0];

    const nameChars = [
      name.charCodeAt(0),
      name.charCodeAt(1),
      name.charCodeAt(2),
      name.charCodeAt(3),
    ];
    output[idx++] = nameChars[0];
    output[idx++] = nameChars[1];
    output[idx++] = nameChars[2];
    output[idx++] = nameChars[3];

    for (let j = 0; j < size; j++) {
      output[idx++] = data[j];
    }

    const crc = crc32(data, crc32(new Uint8Array(nameChars)));
    int32[0] = crc;
    output[idx++] = uint8[3];
    output[idx++] = uint8[2];
    output[idx++] = uint8[1];
    output[idx++] = uint8[0];
  }

  return output;
}

interface PngChunk {
  name: string;
  data: Uint8Array;
}

interface TextChunkData {
  keyword: string;
  text: string;
}

export interface CharacterCardV2 {
  spec: string;
  spec_version: string;
  data: {
    name: string;
    description: string;
    personality: string;
    scenario: string;
    first_mes: string;
    mes_example: string;
    creator_notes: string;
    system_prompt: string;
    post_history_instructions: string;
    alternate_greetings: string[];
    tags: string[];
    creator: string;
    character_version: string;
    extensions: Record<string, unknown>;
    character_book?: {
      entries: Array<Record<string, unknown>>;
      extensions: Record<string, unknown>;
    };
    [key: string]: unknown;
  };
  create_date?: string;
  [key: string]: unknown;
}

/**
 * Read character card JSON from a PNG file.
 */
export function readCardFromPng(pngPath: string): CharacterCardV2 {
  const buffer = fs.readFileSync(pngPath);
  const chunks: PngChunk[] = extract(new Uint8Array(buffer));

  const textChunks: TextChunkData[] = chunks
    .filter((c: PngChunk) => c.name === "tEXt")
    .map((c: PngChunk) => PNGtext.decode(c.data));

  if (textChunks.length === 0) {
    throw new Error("PNG does not contain any text metadata chunks");
  }

  // V3 takes precedence
  const ccv3 = textChunks.find(
    (c) => c.keyword.toLowerCase() === "ccv3"
  );
  if (ccv3) {
    return JSON.parse(Buffer.from(ccv3.text, "base64").toString("utf8"));
  }

  const chara = textChunks.find(
    (c) => c.keyword.toLowerCase() === "chara"
  );
  if (chara) {
    return JSON.parse(Buffer.from(chara.text, "base64").toString("utf8"));
  }

  throw new Error("PNG does not contain character card metadata (chara/ccv3)");
}

/**
 * Write character card JSON back to a PNG file.
 */
export function writeCardToPng(
  pngPath: string,
  card: CharacterCardV2,
  outputPath?: string
): void {
  const buffer = fs.readFileSync(pngPath);
  const chunks: PngChunk[] = extract(new Uint8Array(buffer));

  // Remove existing chara/ccv3 tEXt chunks
  const filtered = chunks.filter((chunk: PngChunk) => {
    if (chunk.name !== "tEXt") return true;
    const decoded: TextChunkData = PNGtext.decode(chunk.data);
    const kw = decoded.keyword.toLowerCase();
    return kw !== "chara" && kw !== "ccv3";
  });

  // Ensure v2 spec
  const v2Data = { ...card, spec: "chara_card_v2", spec_version: "2.0" };
  const v2Json = JSON.stringify(v2Data);
  const v2Base64 = Buffer.from(v2Json, "utf8").toString("base64");
  filtered.splice(-1, 0, PNGtext.encode("chara", v2Base64));

  // Also write v3
  const v3Data = { ...card, spec: "chara_card_v3", spec_version: "3.0" };
  const v3Json = JSON.stringify(v3Data);
  const v3Base64 = Buffer.from(v3Json, "utf8").toString("base64");
  filtered.splice(-1, 0, PNGtext.encode("ccv3", v3Base64));

  const newBuffer = Buffer.from(encodePngChunks(filtered));
  fs.writeFileSync(outputPath || pngPath, newBuffer);
}

/**
 * List all PNG character card files in a directory.
 */
export function listCards(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".png"))
    .sort();
}

/**
 * Get a field from the character card data using dot notation.
 * e.g. "data.name", "data.description", "data.character_book.entries"
 */
export function getCardField(card: CharacterCardV2, fieldPath: string): unknown {
  const parts = fieldPath.split(".");
  let current: unknown = card;
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Set a field on the character card data using dot notation.
 */
export function setCardField(
  card: CharacterCardV2,
  fieldPath: string,
  value: unknown
): void {
  const parts = fieldPath.split(".");
  let current: Record<string, unknown> = card as unknown as Record<string, unknown>;
  for (let i = 0; i < parts.length - 1; i++) {
    if (current[parts[i]] === undefined || typeof current[parts[i]] !== "object") {
      current[parts[i]] = {};
    }
    current = current[parts[i]] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}

/**
 * Extract a character card PNG into workspace files.
 * Creates: workspace/cards/{name}/card.json, avatar.png, greetings/*.txt, world/*
 */
export function extractCardToWorkspace(
  pngPath: string,
  workspaceDir: string,
  worldsDir?: string
): { outDir: string; cardJsonPath: string; avatarPath: string; greetingFiles: string[]; regexFiles: string[]; worldDir?: string } {
  const card = readCardFromPng(pngPath) as CharacterCardV2 & { world?: string; [k: string]: unknown };
  const cardName = card.data.name || path.basename(pngPath, ".png");
  const sanitized = sanitizeFilename(cardName);
  const outDir = path.join(workspaceDir, "cards", sanitized);

  fs.mkdirSync(outDir, { recursive: true });

  // --- Extract greetings to txt files ---
  const greetingsDir = path.join(outDir, "greetings");
  fs.mkdirSync(greetingsDir, { recursive: true });
  const greetingFiles: string[] = [];

  if (card.data.first_mes) {
    const fname = "000_first_mes.txt";
    fs.writeFileSync(path.join(greetingsDir, fname), card.data.first_mes, "utf8");
    greetingFiles.push(fname);
  }
  if (card.data.alternate_greetings) {
    for (let i = 0; i < card.data.alternate_greetings.length; i++) {
      const fname = `${String(i + 1).padStart(3, "0")}_greeting.txt`;
      fs.writeFileSync(path.join(greetingsDir, fname), card.data.alternate_greetings[i], "utf8");
      greetingFiles.push(fname);
    }
  }

  // --- Extract regex scripts to individual files ---
  const regexDir = path.join(outDir, "regex");
  fs.mkdirSync(regexDir, { recursive: true });
  const regexFiles: string[] = [];
  const regexScripts = card.data.extensions?.regex_scripts;

  if (Array.isArray(regexScripts)) {
    for (let i = 0; i < regexScripts.length; i++) {
      const script = regexScripts[i] as Record<string, unknown>;
      const seq = String(i).padStart(3, "0");
      const name = sanitizeFilename(String(script.scriptName || "unnamed"));
      const baseName = `${seq}_${name}`;

      const { replaceString, ...meta } = script;
      fs.writeFileSync(
        path.join(regexDir, `${baseName}-replace.txt`),
        String(replaceString ?? ""),
        "utf8"
      );
      fs.writeFileSync(
        path.join(regexDir, `${baseName}.json`),
        JSON.stringify(meta, null, 2),
        "utf8"
      );
      regexFiles.push(`${baseName}.json`);
    }
  }

  // Remove greetings from card.json (they live in .txt now)
  const cardForJson = JSON.parse(JSON.stringify(card));
  delete cardForJson.data.first_mes;
  delete cardForJson.data.alternate_greetings;

  // Remove V1 top-level fields that duplicate data.* (redundant)
  const v1DuplicateFields = ['name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example', 'tags'];
  for (const f of v1DuplicateFields) {
    delete cardForJson[f];
  }

  // Remove embedded character_book — it's extracted to world/
  delete cardForJson.data?.character_book;

  // Remove regex_scripts — they're extracted to regex/
  if (cardForJson.data?.extensions?.regex_scripts) {
    delete cardForJson.data.extensions.regex_scripts;
  }

  // Write card.json with _source for apply
  const cardWithSource = { ...cardForJson, _source: pngPath };
  const cardJsonPath = path.join(outDir, "card.json");
  fs.writeFileSync(cardJsonPath, JSON.stringify(cardWithSource, null, 2), "utf8");

  // Copy avatar PNG
  const avatarPath = path.join(outDir, "avatar.png");
  fs.copyFileSync(pngPath, avatarPath);

  // --- Extract linked world book ---
  let worldOutDir: string | undefined;
  const worldName: string | undefined =
    (card.data?.extensions?.world as string) || (card.world as string) || undefined;
  if (worldName && worldsDir) {
    const worldPath = path.join(worldsDir, worldName + ".json");
    if (fs.existsSync(worldPath)) {
      const worldTargetDir = path.join(outDir, "world");
      const result = extractWorldToWorkspace(worldPath, outDir, "world");
      worldOutDir = result.outDir;
    }
  }

  return { outDir, cardJsonPath, avatarPath, greetingFiles, regexFiles, worldDir: worldOutDir };
}

/**
 * Apply card.json from workspace back to the original PNG.
 * Also reads greetings/*.txt and applies world/ back.
 */
export function applyCardFromWorkspace(
  cardDir: string,
  outputPath?: string
): string {
  const cardJsonPath = path.join(cardDir, "card.json");
  const avatarPath = path.join(cardDir, "avatar.png");

  if (!fs.existsSync(cardJsonPath)) {
    throw new Error(`card.json not found in ${cardDir}`);
  }
  if (!fs.existsSync(avatarPath)) {
    throw new Error(`avatar.png not found in ${cardDir}`);
  }

  const raw = JSON.parse(fs.readFileSync(cardJsonPath, "utf8"));
  const source: string = raw._source;
  const { _source, ...card } = raw;

  // --- Read greetings from txt files ---
  const greetingsDir = path.join(cardDir, "greetings");
  if (fs.existsSync(greetingsDir)) {
    const files = fs.readdirSync(greetingsDir).filter(f => f.endsWith(".txt")).sort();
    for (const file of files) {
      const content = fs.readFileSync(path.join(greetingsDir, file), "utf8");
      if (file.includes("first_mes")) {
        card.data.first_mes = content;
      } else {
        if (!card.data.alternate_greetings) card.data.alternate_greetings = [];
        card.data.alternate_greetings.push(content);
      }
    }
  }

  // --- Read regex scripts from regex/ files ---
  const regexDir = path.join(cardDir, "regex");
  if (fs.existsSync(regexDir)) {
    const regexJsonFiles = fs.readdirSync(regexDir).filter(f => f.endsWith(".json")).sort();
    if (regexJsonFiles.length > 0) {
      const scripts: Record<string, unknown>[] = [];
      for (const file of regexJsonFiles) {
        const meta = JSON.parse(fs.readFileSync(path.join(regexDir, file), "utf8"));
        const baseName = file.replace(/\.json$/, "");
        const replacePath = path.join(regexDir, `${baseName}-replace.txt`);
        const replaceString = fs.existsSync(replacePath)
          ? fs.readFileSync(replacePath, "utf8")
          : "";
        scripts.push({ ...meta, replaceString });
      }
      if (!card.data.extensions) card.data.extensions = {};
      card.data.extensions.regex_scripts = scripts;
    }
  }

  const target = outputPath || source;
  if (!target) {
    throw new Error("No output path and no _source in card.json");
  }

  // --- Apply world book back and embed in card ---
  const worldDir = path.join(cardDir, "world");
  if (fs.existsSync(worldDir) && fs.existsSync(path.join(worldDir, "_meta.json"))) {
    const worldTarget = applyWorldFromWorkspace(worldDir);
    // Embed world book back into card.data.character_book for self-contained PNG
    const worldData = JSON.parse(fs.readFileSync(worldTarget, "utf8"));
    card.data.character_book = worldData;
  }

  // Restore V1 top-level fields from data.* for compatibility
  const v1DuplicateFields = ['name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example', 'tags'] as const;
  for (const f of v1DuplicateFields) {
    if (card.data[f] !== undefined) {
      (card as Record<string, unknown>)[f] = card.data[f];
    }
  }

  // Write card data into avatar.png (which has the image data)
  writeCardToPng(avatarPath, card as CharacterCardV2, target);

  return target;
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[/\\:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}
