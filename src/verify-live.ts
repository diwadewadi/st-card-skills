import fs from "node:fs";
import path from "node:path";

import { chromium, type BrowserContext, type ConsoleMessage, type Page } from "playwright-core";

export interface VerifyLiveOptions {
  cardName: string;
  moduleName?: string;
  stUrl: string;
  browserChannel: string;
  userDataDir: string;
  timeoutMs: number;
  logDir: string;
}

function sanitizeForFileName(value: string): string {
  return value.replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").trim() || "session";
}

function formatTimestamp(date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

function formatConsoleLocation(message: ConsoleMessage): string {
  const location = message.location();
  if (!location.url) return "";

  const line = typeof location.lineNumber === "number" ? location.lineNumber + 1 : 0;
  const column = typeof location.columnNumber === "number" ? location.columnNumber + 1 : 0;
  const suffix = line > 0 ? `:${line}${column > 0 ? `:${column}` : ""}` : "";
  return ` (${location.url}${suffix})`;
}

function attachPageLogging(page: Page, writeLog: (line: string) => void): void {
  let pageLabel = page.url() || "about:blank";

  writeLog(`[page] attached ${pageLabel}`);

  page.on("framenavigated", (frame) => {
    if (frame !== page.mainFrame()) return;
    pageLabel = frame.url() || "about:blank";
    writeLog(`[page] navigated ${pageLabel}`);
  });

  page.on("console", (message) => {
    writeLog(
      `[console:${message.type()}] ${message.text()}${formatConsoleLocation(message)}`,
    );
  });

  page.on("pageerror", (error) => {
    writeLog(`[pageerror] ${error.name}: ${error.message}`);
    if (error.stack) {
      for (const line of error.stack.split(/\r?\n/)) {
        writeLog(`[pageerror:stack] ${line}`);
      }
    }
  });

  page.on("requestfailed", (request) => {
    const failure = request.failure();
    writeLog(
      `[requestfailed] ${request.method()} ${request.url()} -> ${failure?.errorText ?? "unknown error"}`,
    );
  });
}

export async function verifyLive(options: VerifyLiveOptions): Promise<void> {
  const stUrl = new URL(options.stUrl).toString();
  const timeoutMs = Number.isFinite(options.timeoutMs) && options.timeoutMs > 0
    ? options.timeoutMs
    : 15000;

  fs.mkdirSync(options.logDir, { recursive: true });
  fs.mkdirSync(options.userDataDir, { recursive: true });

  const logFileName = `${formatTimestamp()}-${sanitizeForFileName(options.moduleName || "live")}.log`;
  const logFile = path.join(options.logDir, logFileName);

  const writeLog = (line: string): void => {
    const stamped = `[${new Date().toISOString()}] ${line}`;
    fs.appendFileSync(logFile, stamped + "\n");
    console.log(stamped);
  };

  writeLog(`[verify-live] launching browser channel="${options.browserChannel}" url="${stUrl}"`);
  writeLog(`[verify-live] log file: ${logFile}`);

  let context: BrowserContext;
  try {
    context = await chromium.launchPersistentContext(options.userDataDir, {
      channel: options.browserChannel,
      headless: false,
      ignoreHTTPSErrors: true,
      viewport: null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Unable to launch browser channel "${options.browserChannel}". ` +
      `Install that browser locally or retry with --browser chrome / --browser msedge. ` +
      `Original error: ${message}`,
    );
  }

  const trackedPages = new WeakSet<Page>();
  const monitorPage = (page: Page): void => {
    if (trackedPages.has(page)) return;
    trackedPages.add(page);
    attachPageLogging(page, writeLog);
  };

  for (const page of context.pages()) {
    monitorPage(page);
  }
  context.on("page", monitorPage);

  const page = context.pages()[0] ?? await context.newPage();
  monitorPage(page);

  try {
    await page.goto(stUrl, { waitUntil: "domcontentloaded", timeout: timeoutMs });
    await page.bringToFront();
  } catch (error) {
    await context.close();
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Unable to open SillyTavern at ${stUrl}. ` +
      `Start the server first or pass --st-url <url>. Original error: ${message}`,
    );
  }

  const moduleText = options.moduleName ? ` module "${options.moduleName}"` : " target UI";
  writeLog(
    `[verify-live] browser ready. In SillyTavern, load card "${options.cardName}" and trigger the${moduleText}.`,
  );
  writeLog("[verify-live] console, page errors, and failed requests will stream here until the browser closes.");
  writeLog("[verify-live] close the browser window or press Ctrl+C to finish.");

  await new Promise<void>((resolve) => {
    let settled = false;

    const finish = (): void => {
      if (settled) return;
      settled = true;
      process.off("SIGINT", onInterrupt);
      process.off("SIGTERM", onInterrupt);
      resolve();
    };

    const onInterrupt = (): void => {
      writeLog("[verify-live] interrupt received, closing browser...");
      void context.close().finally(finish);
    };

    process.on("SIGINT", onInterrupt);
    process.on("SIGTERM", onInterrupt);
    context.on("close", finish);
  });
}
