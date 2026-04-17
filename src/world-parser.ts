import fs from "node:fs";
import path from "node:path";

export interface WorldEntry {
  key: string[];
  keysecondary: string[];
  comment: string;
  content: string;
  constant: boolean;
  vectorized: boolean;
  selective: boolean;
  selectiveLogic: number;
  addMemo: boolean;
  order: number;
  position: number;
  disable: boolean;
  ignoreBudget: boolean;
  excludeRecursion: boolean;
  preventRecursion: boolean;
  matchPersonaDescription: boolean;
  matchCharacterDescription: boolean;
  matchCharacterPersonality: boolean;
  matchCharacterDepthPrompt: boolean;
  matchScenario: boolean;
  matchCreatorNotes: boolean;
  delayUntilRecursion: boolean;
  probability: number;
  useProbability: boolean;
  depth: number;
  outletName: string;
  group: string;
  groupOverride: boolean;
  groupWeight: number;
  scanDepth: number | null;
  caseSensitive: boolean | null;
  matchWholeWords: boolean | null;
  useGroupScoring: boolean;
  automationId: string;
  role: number;
  sticky: number;
  cooldown: number;
  delay: number;
  triggers: unknown[];
  uid: number;
  displayIndex: number;
  extensions: Record<string, unknown>;
  [extra: string]: unknown;
}

export interface WorldBook {
  entries: Record<string, WorldEntry>;
  [extra: string]: unknown;
}

interface WorldWorkspaceMeta {
  _schema: "st-card-tools/world-workspace-meta@1";
  _source: string;
  _generatedAt: string;
  _world: Record<string, unknown>;
}


/**
 * List world book JSON files in a directory.
 */
export function listWorlds(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.toLowerCase().endsWith(".json"))
    .sort();
}

/**
 * Read a world book from a JSON file.
 */
export function readWorld(filePath: string): WorldBook {
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as WorldBook;
}

/**
 * Write a world book to a JSON file.
 */
export function writeWorld(filePath: string, world: WorldBook): void {
  fs.writeFileSync(filePath, JSON.stringify(world, null, 4), "utf8");
}

/**
 * Get a single entry from a world book by its key (the object key in entries, e.g. "0", "1").
 */
export function getWorldEntry(
  world: WorldBook,
  entryId: string
): WorldEntry | undefined {
  return world.entries[entryId];
}

/**
 * Get summary list of all entries: id, comment, key, enabled/disabled.
 */
export function getWorldEntrySummaries(
  world: WorldBook
): Array<{
  id: string;
  comment: string;
  keys: string[];
  disabled: boolean;
  constant: boolean;
  position: number;
  order: number;
  contentLength: number;
}> {
  return Object.entries(world.entries).map(([id, entry]) => ({
    id,
    comment: entry.comment,
    keys: entry.key,
    disabled: entry.disable,
    constant: entry.constant,
    position: entry.position,
    order: entry.order,
    contentLength: entry.content.length,
  }));
}

/**
 * Create default world entry with sensible defaults.
 */
function createDefaultEntry(uid: number): WorldEntry {
  return {
    key: [],
    keysecondary: [],
    comment: "",
    content: "",
    constant: false,
    vectorized: false,
    selective: false,
    selectiveLogic: 0,
    addMemo: true,
    order: 100,
    position: 0,
    disable: false,
    ignoreBudget: false,
    excludeRecursion: false,
    preventRecursion: false,
    matchPersonaDescription: false,
    matchCharacterDescription: false,
    matchCharacterPersonality: false,
    matchCharacterDepthPrompt: false,
    matchScenario: false,
    matchCreatorNotes: false,
    delayUntilRecursion: false,
    probability: 100,
    useProbability: true,
    depth: 4,
    outletName: "",
    group: "",
    groupOverride: false,
    groupWeight: 100,
    scanDepth: null,
    caseSensitive: null,
    matchWholeWords: null,
    useGroupScoring: false,
    automationId: "",
    role: 0,
    sticky: 0,
    cooldown: 0,
    delay: 0,
    triggers: [],
    uid,
    displayIndex: uid,
    extensions: {
      position: 0,
      exclude_recursion: false,
      display_index: uid,
      probability: 100,
      useProbability: true,
      depth: 4,
      selectiveLogic: 0,
      group: "",
      group_override: false,
      group_weight: 100,
      prevent_recursion: false,
      delay_until_recursion: false,
      scan_depth: null,
      match_whole_words: null,
      use_group_scoring: false,
      case_sensitive: null,
      automation_id: "",
      role: 0,
      vectorized: false,
      sticky: 0,
      cooldown: 0,
      delay: 0,
      match_persona_description: false,
      match_character_description: false,
      match_character_personality: false,
      match_character_depth_prompt: false,
      match_scenario: false,
      match_creator_notes: false,
      triggers: [],
      ignore_budget: false,
    },
  };
}

/**
 * Set/update a world entry. If entryId is not provided, creates a new entry.
 * Partial updates are supported - only provided fields will be overwritten.
 */
export function setWorldEntry(
  world: WorldBook,
  entryId: string | undefined,
  updates: Partial<WorldEntry>
): { world: WorldBook; entryId: string } {
  let id: string;

  if (entryId !== undefined && world.entries[entryId]) {
    // Update existing
    id = entryId;
    world.entries[id] = { ...world.entries[id], ...updates };
  } else {
    // Create new - find next available id and uid
    const existingIds = Object.keys(world.entries).map(Number);
    const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 0;
    const existingUids = Object.values(world.entries).map((e) => e.uid);
    const nextUid =
      existingUids.length > 0 ? Math.max(...existingUids) + 1 : 0;

    id = entryId ?? String(nextId);
    const defaultEntry = createDefaultEntry(nextUid);
    world.entries[id] = { ...defaultEntry, ...updates, uid: nextUid };
  }

  return { world, entryId: id };
}

/**
 * Delete a world entry by its ID.
 */
export function deleteWorldEntry(
  world: WorldBook,
  entryId: string
): boolean {
  if (world.entries[entryId] === undefined) return false;
  delete world.entries[entryId];
  return true;
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/[/\\:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

/**
 * Extract a world book into workspace files.
 * Creates: workspace/worlds/{name}/_meta.json + {seq}_{comment}.json per entry
 */
export function extractWorldToWorkspace(
  worldPath: string,
  workspaceDir: string,
  subDir?: string
): { outDir: string; entryFiles: string[] } {
  const world = readWorld(worldPath);
  const bookName = path.basename(worldPath, ".json");
  const sanitized = sanitizeFilename(bookName);
  const outDir = subDir
    ? path.join(workspaceDir, subDir)
    : path.join(workspaceDir, "worlds", sanitized);

  fs.mkdirSync(outDir, { recursive: true });

  const { entries, ...worldTopLevel } = world;
  const generatedAt = new Date().toISOString();
  const meta: WorldWorkspaceMeta = {
    _schema: "st-card-tools/world-workspace-meta@1",
    _source: worldPath,
    _generatedAt: generatedAt,
    _world: worldTopLevel,
  };

  // Write _meta.json with source path and top-level world metadata.
  fs.writeFileSync(
    path.join(outDir, "_meta.json"),
    JSON.stringify(meta, null, 2),
    "utf8"
  );

  // Write each entry as a separate file
  const entryFiles: string[] = [];
  const sortedIds = Object.keys(entries).sort(
    (a, b) => Number(a) - Number(b)
  );

  for (let i = 0; i < sortedIds.length; i++) {
    const id = sortedIds[i];
    const entry = entries[id];
    const seq = String(i).padStart(3, "0");
    const comment = sanitizeFilename(entry.comment || "unnamed");
    const baseName = `${seq}_${comment}`;

    // Write content to a separate .txt for easy editing
    const { content, ...entryMeta } = entry;
    fs.writeFileSync(
      path.join(outDir, `${baseName}-content.txt`),
      content,
      "utf8"
    );

    // Write metadata (without content) to .json
    const entryWithId = { _id: id, ...entryMeta };
    fs.writeFileSync(
      path.join(outDir, `${baseName}.json`),
      JSON.stringify(entryWithId, null, 2),
      "utf8"
    );
    entryFiles.push(`${baseName}.json`);
  }

  // Remove stale _manifest.json from previous versions
  const oldManifest = path.join(outDir, "_manifest.json");
  if (fs.existsSync(oldManifest)) fs.unlinkSync(oldManifest);

  return { outDir, entryFiles };
}

/**
 * Apply workspace files back to the original world book JSON.
 */
export function applyWorldFromWorkspace(
  worldDir: string,
  outputPath?: string
): string {
  const metaPath = path.join(worldDir, "_meta.json");
  if (!fs.existsSync(metaPath)) {
    throw new Error(`_meta.json not found in ${worldDir}`);
  }

  const metaRaw = JSON.parse(fs.readFileSync(metaPath, "utf8")) as Partial<WorldWorkspaceMeta> & {
    _source?: string;
    _world?: Record<string, unknown>;
  };
  const target = outputPath || metaRaw._source;
  if (!target) {
    throw new Error("No output path and no _source in _meta.json");
  }

  // Read all entry files (sorted by filename)
  const files = fs
    .readdirSync(worldDir)
    .filter((f) => f.endsWith(".json") && !f.startsWith("_"))
    .sort();

  const entries: Record<string, WorldEntry> = {};
  for (const file of files) {
    const raw = JSON.parse(
      fs.readFileSync(path.join(worldDir, file), "utf8")
    );
    const { _id, ...entry } = raw;
    const id = _id ?? String(Object.keys(entries).length);

    // Read content from companion -content.txt if it exists
    const baseName = file.replace(/\.json$/, "");
    const txtPath = path.join(worldDir, `${baseName}-content.txt`);
    if (fs.existsSync(txtPath)) {
      entry.content = fs.readFileSync(txtPath, "utf8");
    }

    entries[id] = entry as WorldEntry;
  }

  const existingWorld = fs.existsSync(target) ? readWorld(target) : { entries: {} };
  const { entries: _existingEntries, ...existingTopLevel } = existingWorld;
  const preservedTopLevel = isPlainObject(metaRaw._world)
    ? metaRaw._world
    : existingTopLevel;

  const world: WorldBook = {
    ...preservedTopLevel,
    entries,
  };
  writeWorld(target, world);
  return target;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
