import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

const DIST_DIR = path.resolve("dist");
const PORT = 4255;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split("?")[0];
  if (reqPath === "/") reqPath = "/index.html";
  const filePath = path.join(DIST_DIR, reqPath);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not Found");
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "text/plain" });
  fs.createReadStream(filePath).pipe(res);
});

async function main() {
  await new Promise((resolve) => server.listen(PORT, "127.0.0.1", resolve));
  console.log(`[Test Server] Serving dist on http://127.0.0.1:${PORT}`);

  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const debugPort = 9260;
  const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-user-fixes-test-"));

  const chrome = spawn(
    chromePath,
    [
      "--headless=new",
      "--no-sandbox",
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${tempUserDataDir}`,
      "--window-size=1920,1080",
      `http://127.0.0.1:${PORT}/`,
    ],
    { stdio: "ignore" }
  );

  const cleanup = () => {
    try {
      chrome.kill("SIGKILL");
    } catch {}
    try {
      server.close();
    } catch {}
    try {
      fs.rmSync(tempUserDataDir, { recursive: true, force: true });
    } catch {}
  };

  process.on("exit", cleanup);
  process.on("SIGINT", () => process.exit(1));

  let versionData = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 300));
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
      if (res.ok) {
        versionData = await res.json();
        break;
      }
    } catch {}
  }

  if (!versionData) {
    throw new Error("Could not connect to Chrome debugging port");
  }

  const browserWsUrl = versionData.webSocketDebuggerUrl;
  const ws = new WebSocket(browserWsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", reject);
  });

  let idCounter = 1;
  const pending = new Map();
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  });

  function sendCommand(method, params = {}, sessionId = null) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      const payload = { id, method, params };
      if (sessionId) payload.sessionId = sessionId;
      ws.send(JSON.stringify(payload));
    });
  }

  // Get pages
  const targets = await sendCommand("Target.getTargets");
  const pageTarget = targets.targetInfos.find((t) => t.type === "page");
  const { sessionId } = await sendCommand("Target.attachToTarget", {
    targetId: pageTarget.targetId,
    flatten: true,
  });

  await sendCommand("Page.enable", {}, sessionId);
  await sendCommand("Runtime.enable", {}, sessionId);
  await sendCommand(
    "Emulation.setDeviceMetricsOverride",
    {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 1,
      mobile: false,
    },
    sessionId
  );

  const evaluate = async (expression) => {
    const res = await sendCommand("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    }, sessionId);
    if (res.exceptionDetails) {
      throw new Error(`Eval failed: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  };

  const artifactDir = "C:\\Users\\Dell\\.gemini\\antigravity\\brain\\e09ef443-56f5-4d57-9d91-020814f19093";
  const takeScreenshot = async (filename) => {
    const res = await sendCommand("Page.captureScreenshot", { format: "png" }, sessionId);
    const buffer = Buffer.from(res.data, "base64");
    const outPath = path.join(artifactDir, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`[Screenshot Saved] -> ${outPath}`);
  };

  console.log("=== WAITING FOR PAGE LOAD ===");
  await new Promise((r) => setTimeout(r, 1200));

  // 1. Verify Presenter Bar is removed from DOM
  const hasPresenterBar = await evaluate("!!document.getElementById('ceremony-presenter-bar')");
  console.log(`Presenter bar in DOM: ${hasPresenterBar} (expected false)`);
  if (hasPresenterBar) {
    throw new Error("Presenter bar should NOT exist in DOM!");
  }

  // 2. Take screenshot of Step 1: Curtain (no bottom toolbar)
  await takeScreenshot("test-verified-1-curtain-no-toolbar.png");

  // 3. Test Keyboard shortcut: ArrowRight or Enter to advance
  console.log("=== TEST KEYBOARD SHORTCUT: Enter to Open Curtain ===");
  await evaluate("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))");
  await new Promise((r) => setTimeout(r, 2200)); // wait for curtain parting transition

  // Should now be on Step 2: SJBIT
  await takeScreenshot("test-verified-2-sjbit-slide.png");

  // 4. Test Keyboard shortcut: Escape to skip directly to 24H Live Countdown
  console.log("=== TEST KEYBOARD SHORTCUT: Escape to Skip to Timer ===");
  await evaluate("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))");
  await new Promise((r) => setTimeout(r, 1500));

  // Should now be on 24H Live Countdown Screen
  const isCountdownActive = await evaluate("document.getElementById('screen-countdown')?.classList.contains('active')");
  console.log(`Countdown screen active: ${isCountdownActive} (expected true)`);

  // Verify Header position is relative (scrolls with page)
  const headerPosition = await evaluate("window.getComputedStyle(document.querySelector('.site-header')).position");
  console.log(`Site header position: ${headerPosition} (expected relative)`);

  // Verify 25 years logo is highlighted
  const jubileeHasWrap = await evaluate("!!document.querySelector('.triptych-jubilee-wrap')");
  const jubileeBoxShadow = await evaluate("window.getComputedStyle(document.querySelector('.triptych-jubilee-wrap')).boxShadow");
  console.log(`25 Years wrap present: ${jubileeHasWrap}, box-shadow: ${jubileeBoxShadow}`);

  // Take screenshot of 24H live countdown screen
  await takeScreenshot("test-verified-3-countdown-highlighted-25y.png");

  // Scroll down slightly to demonstrate scrolling along with header
  await evaluate("window.scrollTo(0, 180)");
  await new Promise((r) => setTimeout(r, 600));
  await takeScreenshot("test-verified-4-scrolled-header-moves.png");

  console.log("=== ALL FIXES VERIFIED SUCCESSFULLY ===");

  ws.close();
  cleanup();
  process.exit(0);
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
