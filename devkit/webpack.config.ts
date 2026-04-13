/**
 * st-card-devkit webpack configuration
 *
 * Clean room implementation providing:
 * - Vue 3 SFC + TypeScript + Tailwind CSS + SCSS
 * - Auto-discover entries under workspace/cards/<name>/src/
 * - Two output modes: HTML (inline everything) or JS (ES module)
 * - Socket.io dev server for hot reload with TavernHelper extension
 * - SillyTavern globals externalized (jQuery, lodash, Vue, Zod, etc.)
 * - Unknown npm packages externalized to jsDelivr CDN
 *
 * Entry discovery:
 *   Scans workspace/cards/<cardname>/src/ for index.{ts,tsx,js,jsx}.
 *   Output goes to workspace/cards/<cardname>/dist/.
 *   Workspace path is read from ~/.st-card-tools.json or --env workspace=<path>.
 *
 * MIT License
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

import HtmlWebpackPlugin from 'html-webpack-plugin';
import HtmlInlineScriptWebpackPlugin from 'html-inline-script-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import unpluginAutoImport from 'unplugin-auto-import/webpack';
import unpluginVueComponents from 'unplugin-vue-components/webpack';
import { VueLoaderPlugin } from 'vue-loader';
import webpack from 'webpack';

const require = createRequire(import.meta.url);
const HTMLInlineCSSWebpackPlugin = require('html-inline-css-webpack-plugin').default;

// ---------------------------------------------------------------------------
// Root directory of this devkit
// ---------------------------------------------------------------------------
const ROOT = import.meta.dirname;

// ---------------------------------------------------------------------------
// Exclude node_modules — but allow devkit's own util/ and types/ directories
// (they live under node_modules/st-card-skills/devkit/ and contain TypeScript
// that must be compiled by ts-loader)
// ---------------------------------------------------------------------------
const excludeNodeModules = (filePath: string) => {
  if (filePath.includes('node_modules')) {
    const normalized = filePath.replace(/\\/g, '/');
    if (
      normalized.includes('st-card-skills/devkit/util/') ||
      normalized.includes('st-card-skills/devkit/types/')
    ) {
      return false; // don't exclude — these are devkit's own sources
    }
    return true; // exclude everything else in node_modules
  }
  return false; // not in node_modules — don't exclude
};

// ---------------------------------------------------------------------------
// Generate a build-time tsconfig that extends the base and includes the
// workspace source directory. This avoids hardcoding paths in tsconfig.json
// and keeps the devkit portable across machines. The generated file is
// written to ROOT/tsconfig.build.json and used by ts-loader.
// ---------------------------------------------------------------------------

const TSCONFIG_BUILD = path.join(ROOT, 'tsconfig.build.json');

function ensureBuildTsconfig(workspace: string): string {
  const workspaceGlob = path.resolve(workspace, 'cards/*/src/**/*').replace(/\\/g, '/');
  const content = JSON.stringify(
    {
      extends: './tsconfig.json',
      include: ['types', 'util', 'templates', '*.d.ts', workspaceGlob],
    },
    null,
    2,
  );

  // Only write if content changed — avoids unnecessary ts-loader cache busts
  let existing = '';
  try { existing = fs.readFileSync(TSCONFIG_BUILD, 'utf-8'); } catch { /* first run */ }
  if (existing !== content) {
    fs.writeFileSync(TSCONFIG_BUILD, content, 'utf-8');
  }

  return TSCONFIG_BUILD;
}

// ---------------------------------------------------------------------------
// Resolve workspace path
// ---------------------------------------------------------------------------

function resolveWorkspace(envWorkspace?: string): string {
  // 1. --env workspace=<path> from CLI
  if (envWorkspace) return path.resolve(envWorkspace);

  // 2. Read from ~/.st-card-tools.json
  const configPath = path.join(os.homedir(), '.st-card-tools.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.workspace) return path.resolve(config.workspace);
    } catch { /* ignore parse errors */ }
  }

  // 3. Default: ./workspace relative to cwd
  return path.join(process.cwd(), 'workspace');
}

// ---------------------------------------------------------------------------
// Entry discovery
// ---------------------------------------------------------------------------

interface EntryInfo {
  /** Absolute path to the entry script (index.ts / index.js / index.tsx) */
  script: string;
  /** Absolute path to index.html if the entry is an HTML build */
  html?: string;
  /** Absolute path to the card directory (workspace/cards/<name>) */
  cardDir: string;
  /** Card name (directory name) */
  cardName: string;
}

/**
 * Walk workspace/cards/<name>/src/ looking for index.{ts,tsx,js,jsx} files.
 * If an index.html sits next to the script, treat as an HTML build
 * that inlines everything into one .html file.
 * Otherwise the build produces a standalone ES-module .js.
 *
 * Output goes to workspace/cards/<cardname>/dist/<subpath>/.
 */
function discoverEntries(workspace: string): EntryInfo[] {
  const cardsDir = path.join(workspace, 'cards');
  if (!fs.existsSync(cardsDir)) return [];

  const scripts: string[] = [];
  const scriptNames = new Set(['index.ts', 'index.tsx', 'index.js', 'index.jsx']);
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!scriptNames.has(entry.name)) continue;
      scripts.push(path.relative(workspace, fullPath));
    }
  };

  for (const cardName of fs.readdirSync(cardsDir, { withFileTypes: true })) {
    if (!cardName.isDirectory()) continue;
    const srcDir = path.join(cardsDir, cardName.name, 'src');
    if (!fs.existsSync(srcDir)) continue;
    walk(srcDir);
  }

  // Deduplicate: if a parent dir already has an entry, skip children
  const sorted = scripts.sort();
  const filtered: string[] = [];
  for (const s of sorted) {
    const dir = path.dirname(s);
    if (filtered.some(f => dir.startsWith(path.dirname(f) + path.sep))) continue;
    filtered.push(s);
  }

  return filtered.map(rel => {
    const abs = path.join(workspace, rel);
    const dir = path.dirname(abs);
    const html = path.join(dir, 'index.html');

    // Extract card name: cards/<cardname>/src/...
    const parts = rel.split(/[\\/]/);
    const cardName = parts[1]; // cards/<this>/src/...
    const cardDir = path.join(cardsDir, cardName);

    return {
      script: abs,
      html: fs.existsSync(html) ? html : undefined,
      cardDir,
      cardName,
    };
  });
}

// ---------------------------------------------------------------------------
// Globals map — libraries already available in the SillyTavern runtime
// ---------------------------------------------------------------------------

const ST_GLOBALS: Record<string, string> = {
  jquery: '$',
  lodash: '_',
  showdown: 'showdown',
  toastr: 'toastr',
  vue: 'Vue',
  'vue-router': 'VueRouter',
  yaml: 'YAML',
  zod: 'z',
};

// ---------------------------------------------------------------------------
// Build one webpack config per entry
// ---------------------------------------------------------------------------

function buildConfig(entry: EntryInfo, tsconfigPath: string): (env: any, argv: any) => webpack.Configuration {
  const parsed = path.parse(entry.script);
  const isHtml = entry.html !== undefined;

  // Compute output subdirectory: relative path from <card>/src/ to the entry dir
  const srcRoot = path.join(entry.cardDir, 'src');
  const relFromSrc = path.relative(srcRoot, parsed.dir);

  return (_env, argv) => {
    const isProd = argv.mode === 'production';

    // CSS rule builder — differs between HTML and JS output modes
    const cssUse = (extra?: string) => {
      const loaders: webpack.RuleSetUseItem[] = isHtml
        ? [MiniCssExtractPlugin.loader]
        : [{ loader: 'vue-style-loader', options: { ssrId: true } }];
      loaders.push({ loader: 'css-loader', options: { url: false } }, 'postcss-loader');
      if (extra) loaders.push(extra);
      return loaders;
    };

    return {
      experiments: { outputModule: true },
      devtool: isProd ? 'source-map' : 'eval-source-map',
      watchOptions: { ignored: ['**/dist', '**/node_modules'] },

      entry: entry.script,
      target: 'browserslist',

      output: {
        filename: `${parsed.name}.js`,
        // Output to workspace/cards/<cardname>/dist/<subpath>/
        path: path.join(entry.cardDir, 'dist', relFromSrc),
        chunkFilename: `${parsed.name}.[contenthash].chunk.js`,
        asyncChunks: true,
        clean: true,
        publicPath: '',
        library: { type: 'module' },
      },

      module: {
        rules: [
          { test: /\.vue$/, use: 'vue-loader', exclude: /node_modules/ },
          {
            oneOf: [
              // Raw asset imports (?raw)
              {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                options: {
                  transpileOnly: true,
                  onlyCompileBundledFiles: true,
                  configFile: tsconfigPath,
                },
                resourceQuery: /raw/,
                type: 'asset/source' as const,
                exclude: excludeNodeModules,
              },
              {
                test: /\.(sa|sc)ss$/,
                use: ['postcss-loader', 'sass-loader'],
                resourceQuery: /raw/,
                type: 'asset/source' as const,
                exclude: /node_modules/,
              },
              {
                test: /\.css$/,
                use: ['postcss-loader'],
                resourceQuery: /raw/,
                type: 'asset/source' as const,
                exclude: /node_modules/,
              },
              {
                resourceQuery: /raw/,
                type: 'asset/source' as const,
                exclude: /node_modules/,
              },

              // TypeScript
              {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                options: {
                  transpileOnly: true,
                  onlyCompileBundledFiles: true,
                  configFile: tsconfigPath,
                  compilerOptions: { noUnusedLocals: false, noUnusedParameters: false },
                },
                exclude: excludeNodeModules,
              },

              // HTML
              { test: /\.html$/, use: 'html-loader', exclude: /node_modules/ },

              // YAML
              { test: /\.ya?ml$/, loader: 'yaml-loader' },

              // Stylesheets
              { test: /\.(sa|sc)ss$/, use: cssUse('sass-loader'), exclude: /node_modules/ },
              { test: /\.css$/, use: cssUse(), exclude: /node_modules/ },
            ],
          },
        ],
      },

      resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.css', '.vue'],
        plugins: [
          new TsconfigPathsPlugin({
            extensions: ['.ts', '.tsx', '.js', '.jsx'],
            configFile: tsconfigPath,
          }),
        ],
      },

      plugins: [
        // HTML mode: inline everything into one file
        ...(isHtml
          ? [
              new HtmlWebpackPlugin({
                template: entry.html!,
                filename: path.parse(entry.html!).base,
                scriptLoading: 'module' as const,
                cache: false,
              }),
              new HtmlInlineScriptWebpackPlugin(),
              new MiniCssExtractPlugin(),
              new HTMLInlineCSSWebpackPlugin({
                styleTagFactory({ style }: { style: string }) {
                  return `<style>${style}</style>`;
                },
              }),
            ]
          : [new MiniCssExtractPlugin()]),

        // Vue
        new VueLoaderPlugin(),

        // Auto-imports
        unpluginAutoImport({
          dts: true,
          imports: [
            'vue',
            'pinia',
            '@vueuse/core',
            { from: 'dedent', imports: [['default', 'dedent']] },
            { from: 'klona', imports: ['klona'] },
            { from: 'vue-final-modal', imports: ['useModal'] },
            { from: 'zod', imports: ['z'] },
          ],
        }),
        unpluginVueComponents({ dts: true }),

        // Force single chunk
        new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }),

        // Vue feature flags
        new webpack.DefinePlugin({
          __VUE_OPTIONS_API__: false,
          __VUE_PROD_DEVTOOLS__: !isProd,
          __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
        }),
      ],

      optimization: {
        minimize: true,
        minimizer: [
          isProd
            ? new TerserPlugin({
                terserOptions: {
                  format: { quote_style: 1 },
                  mangle: { reserved: ['_', 'toastr', 'YAML', '$', 'z'] },
                },
              })
            : new TerserPlugin({
                extractComments: false,
                terserOptions: {
                  format: { beautify: true, indent_level: 2 },
                  compress: false,
                  mangle: false,
                },
              }),
        ],
      },

      // Externals: map ST globals, send unknown packages to CDN
      externals: ({ context, request }, callback) => {
        if (!context || !request) return callback();

        // Always bundle relative / absolute / http / alias imports
        if (
          request.startsWith('.') ||
          request.startsWith('/') ||
          request.startsWith('!') ||
          request.startsWith('-') ||
          request.startsWith('http') ||
          request.startsWith('@/') ||
          request.startsWith('@util/') ||
          request.startsWith('@types/') ||
          path.isAbsolute(request) ||
          fs.existsSync(path.join(context, request)) ||
          fs.existsSync(request)
        ) {
          return callback();
        }

        // Bundle Vue-ecosystem packages (except vue/vue-router which are globals)
        if (
          ['vue', 'vue-router'].every(k => request !== k) &&
          ['pixi', 'react', 'vue'].some(k => request.includes(k))
        ) {
          return callback();
        }

        // Known SillyTavern globals
        if (request in ST_GLOBALS) {
          return callback(null, 'var ' + ST_GLOBALS[request]);
        }

        // Everything else → CDN
        return callback(
          null,
          'module-import ' + `https://testingcf.jsdelivr.net/npm/${request}/+esm`,
        );
      },
    };
  };
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export default (env: any, argv: any) => {
  const workspace = resolveWorkspace(env?.workspace);
  const entries = discoverEntries(workspace);

  if (entries.length === 0) {
    console.warn(
      `\x1b[33m[devkit]\x1b[0m No entries found under ${path.join(workspace, 'cards')}.\n` +
      `  Workspace: ${workspace}\n` +
      `  Create workspace/cards/<cardname>/src/<module>/index.ts to get started.\n` +
      `  Or specify a different workspace: pnpm dev --env workspace=<path>`,
    );
    return {};
  }

  console.info(`\x1b[36m[devkit]\x1b[0m Workspace: ${workspace}`);
  for (const e of entries) {
    const rel = path.relative(workspace, e.script);
    const out = path.relative(workspace, path.join(e.cardDir, 'dist'));
    console.info(`\x1b[36m[devkit]\x1b[0m  ${rel} → ${out}/`);
  }

  // Generate a tsconfig.build.json that includes the workspace source paths
  const tsconfigPath = ensureBuildTsconfig(workspace);

  return entries.map(e => buildConfig(e, tsconfigPath)(env, argv));
};
