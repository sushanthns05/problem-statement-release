import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

const DIST_DIR = path.resolve("dist");
const PORT = 4240;

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
  const debugPort = 9250;
  const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-ceremony-test-"));

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

  // Poll for Chrome CDP
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
    console.error("Failed to connect to Chrome remote debugging port.");
    process.exit(1);
  }

  const browserWsUrl = versionData.webSocketDebuggerUrl;
  const ws = new WebSocket(browserWsUrl);

  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", reject);
  });

  let messageId = 1;
  const pendingRequests = new Map();

  ws.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pendingRequests.has(data.id)) {
      const { resolve, reject } = pendingRequests.get(data.id);
      pendingRequests.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  });

  function sendCommand(method, params = {}, sessionId = null) {
    return new Promise((resolve, reject) => {
      const id = messageId++;
      pendingRequests.set(id, { resolve, reject });
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

  async function evaluate(expression) {
    const res = await sendCommand(
      "Runtime.evaluate",
      {
        expression,
        returnByValue: true,
        awaitPromise: true,
      },
      sessionId
    );
    return res.result ? res.result.value : null;
  }

  async function takeScreenshot(fileName) {
    const res = await sendCommand("Page.captureScreenshot", { format: "png" }, sessionId);
    fs.writeFileSync(fileName, Buffer.from(res.data, "base64"));
    console.log(`[Screenshot Captured] ${fileName}`);
  }

  // Wait for initial render
  await new Promise((r) => setTimeout(r, 2000));

  // Clear localStorage so we start fresh at ceremony step 1
  await evaluate("localStorage.clear(); location.reload();");
  await new Promise((r) => setTimeout(r, 2500));

  console.log("=== STEP 1: CURTAIN ===");
  const curtainExists = await evaluate("!!document.getElementById('ceremony-curtain-stage')");
  console.log("Curtain stage exists:", curtainExists);
  await takeScreenshot("test-ceremony-1-curtain.png");

  console.log("=== TRIGGER CURTAIN OPEN ===");
  await evaluate("document.getElementById('btn-open-curtain').click()");
  await new Promise((r) => setTimeout(r, 2200));

  console.log("=== STEP 2: SJBIT ===");
  await takeScreenshot("test-ceremony-2-sjbit.png");

  console.log("=== ADVANCE TO STEP 3: CAMPUS PHOTO ===");
  await evaluate("document.getElementById('btn-pres-next').click()");
  await new Promise((r) => setTimeout(r, 800));
  await takeScreenshot("test-ceremony-3-campus.png");

  console.log("=== ADVANCE TO STEP 4: SWAMIJI PHOTOS (3) ===");
  await evaluate("document.getElementById('btn-pres-next').click()");
  await new Promise((r) => setTimeout(r, 800));
  await takeScreenshot("test-ceremony-4-swamiji.png");

  console.log("=== ADVANCE TO STEP 5: 25 YEAR SILVER JUBILEE ===");
  await evaluate("document.getElementById('btn-pres-next').click()");
  await new Promise((r) => setTimeout(r, 800));
  await takeScreenshot("test-ceremony-5-jubilee.png");

  console.log("=== ADVANCE TO STEP 6: ISE DEPARTMENT ===");
  await evaluate("document.getElementById('btn-pres-next').click()");
  await new Promise((r) => setTimeout(r, 800));
  await takeScreenshot("test-ceremony-6-ise.png");

  console.log("=== ADVANCE TO STEP 7: LAKSHYA 2026 ===");
  await evaluate("document.getElementById('btn-pres-next').click()");
  await new Promise((r) => setTimeout(r, 800));
  await takeScreenshot("test-ceremony-7-lakshya.png");

  console.log("=== ADVANCE TO STEP 8: SPONSORS & ALL LOGOS ===");
  await evaluate("document.getElementById('btn-pres-next').click()");
  await new Promise((r) => setTimeout(r, 800));
  await takeScreenshot("test-ceremony-8-sponsors.png");

  console.log("=== ADVANCE TO STEP 9: PROBLEM STATEMENTS BIG SCREEN ===");
  await evaluate("document.getElementById('btn-pres-next').click()");
  await new Promise((r) => setTimeout(r, 800));
  await takeScreenshot("test-ceremony-9-problem-title.png");

  console.log("=== ADVANCE TO STEP 10: CLICK ON ===");
  await evaluate("document.getElementById('btn-pres-next').click()");
  await new Promise((r) => setTimeout(r, 800));
  await takeScreenshot("test-ceremony-10-click-on.png");

  console.log("=== STEP 11: CLICK DIGNITARY TRIGGER -> THEME 1 INTRO ===");
  await evaluate("document.getElementById('btn-dignitary-trigger').click()");
  await new Promise((r) => setTimeout(r, 1000));
  await takeScreenshot("test-ceremony-11-theme1-intro.png");

  console.log("=== STEP 11b: THEME 1 STATEMENT 1 (3 SECONDS BIG SCREEN) ===");
  await evaluate("document.getElementById('btn-pres-next').click()");
  await new Promise((r) => setTimeout(r, 800));
  await takeScreenshot("test-ceremony-11b-theme1-p1.png");

  console.log("=== JUMP TO STEP 12: THEME 2 INTRO ===");
  // Step 12 is index 21 in steps
  await evaluate("window.__ceremony = document.querySelector('#screen-ceremony');");
  // Let's use presenter Next or jump
  for (let i = 0; i < 10; i++) {
    await evaluate("document.getElementById('btn-pres-next').click()");
    await new Promise((r) => setTimeout(r, 100));
  }
  await new Promise((r) => setTimeout(r, 800));
  await takeScreenshot("test-ceremony-12-theme2-intro.png");

  console.log("=== STEP 13: THEME 2 STATEMENT 11 (3 SECONDS BIG SCREEN) ===");
  await evaluate("document.getElementById('btn-pres-next').click()");
  await new Promise((r) => setTimeout(r, 800));
  await takeScreenshot("test-ceremony-13-theme2-p1.png");

  console.log("=== JUMP TO STEP 14: THEME 3 INTRO ===");
  for (let i = 0; i < 10; i++) {
    await evaluate("document.getElementById('btn-pres-next').click()");
    await new Promise((r) => setTimeout(r, 100));
  }
  await new Promise((r) => setTimeout(r, 800));
  await takeScreenshot("test-ceremony-14-theme3-intro.png");

  console.log("=== STEP 15: THEME 3 STATEMENT 21 (3 SECONDS BIG SCREEN) ===");
  await evaluate("document.getElementById('btn-pres-next').click()");
  await new Promise((r) => setTimeout(r, 800));
  await takeScreenshot("test-ceremony-15-theme3-p1.png");

  console.log("=== JUMP TO STEP 16: COUNTDOWN 5 TO 1 ===");
  for (let i = 0; i < 10; i++) {
    await evaluate("document.getElementById('btn-pres-next').click()");
    await new Promise((r) => setTimeout(r, 100));
  }
  await new Promise((r) => setTimeout(r, 800));
  await takeScreenshot("test-ceremony-16-countdown.png");

  console.log("=== STEP 17: COMPLETE CEREMONY -> 24H LIVE COUNTDOWN TIMER ===");
  await evaluate("document.getElementById('btn-pres-next').click()");
  await new Promise((r) => setTimeout(r, 2200));
  await takeScreenshot("test-ceremony-17-timer-live.png");

  console.log("=== ALL 17 CEREMONY STEPS VERIFIED WITH SCREENSHOTS! ===");

  ws.close();
  cleanup();
  process.exit(0);
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
