import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

const DIST_DIR = path.resolve("dist");
const PORT = 4220;

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split("?")[0];
  if (reqPath === "/") reqPath = "/index.html";

  const filePath = path.join(DIST_DIR, reqPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
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
  const debugPort = 9226;
  const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-getsetgo-"));

  const chrome = spawn(
    chromePath,
    [
      "--headless=new",
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${tempUserDataDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--window-size=1280,900",
      `http://127.0.0.1:${PORT}`,
    ],
    { stdio: "ignore" }
  );

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    try {
      const resp = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
      const data = await resp.json();
      wsUrl = data.webSocketDebuggerUrl;
      if (wsUrl) break;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  const ws = new WebSocket(wsUrl);
  let idCounter = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };
  await new Promise((resolve) => (ws.onopen = resolve));

  const send = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  const { targetInfos } = await send("Target.getTargets");
  const pageTarget = targetInfos.find((t) => t.type === "page");
  const { sessionId } = await send("Target.attachToTarget", {
    targetId: pageTarget.targetId,
    flatten: true,
  });

  const sendPage = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, sessionId, method, params }));
    });
  };

  await sendPage("Page.enable");
  await sendPage("Runtime.enable");

  const evalJs = async (expr) => {
    const res = await sendPage("Runtime.evaluate", {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result ? res.result.value : null;
  };

  const takeScreenshot = async (filename) => {
    const { data } = await sendPage("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(filename, Buffer.from(data, "base64"));
    console.log(`[Screenshot] Saved ${filename}`);
  };

  await new Promise((r) => setTimeout(r, 1200));

  console.log("\n--- STEP 1: VERIFYING INAUGURATION SCREEN ---");
  await takeScreenshot("test-getsetgo-1-landing.png");

  console.log("\n--- STEP 2: PRINCIPAL CLICKS 'LAUNCH NOW' (3 - GET) ---");
  await evalJs(`document.getElementById("btn-launch-now").click()`);
  await new Promise((r) => setTimeout(r, 200));

  const num3 = await evalJs(`document.getElementById("intro-number-display").textContent.trim()`);
  const label3 = await evalJs(`document.getElementById("intro-label-display").textContent.trim()`);
  console.log(`Step 3s: Number=${num3}, Label=${label3}`);
  if (num3 !== "3" || label3 !== "GET") {
    throw new Error(`Expected 3 - GET, got ${num3} - ${label3}`);
  }
  await takeScreenshot("test-getsetgo-2-get.png");

  console.log("\n--- STEP 3: WAITING FOR (2 - SET) ---");
  let num2 = null;
  let label2 = null;
  for (let i = 0; i < 30; i++) {
    num2 = await evalJs(`document.getElementById("intro-number-display").textContent.trim()`);
    label2 = await evalJs(`document.getElementById("intro-label-display").textContent.trim()`);
    if (num2 === "2") break;
    await new Promise((r) => setTimeout(r, 100));
  }
  console.log(`Step 2s: Number=${num2}, Label=${label2}`);
  if (num2 !== "2" || label2 !== "SET") {
    throw new Error(`Expected 2 - SET, got ${num2} - ${label2}`);
  }
  await takeScreenshot("test-getsetgo-3-set.png");

  console.log("\n--- STEP 4: WAITING FOR (1 - GO!) ---");
  let num1 = null;
  let label1 = null;
  for (let i = 0; i < 30; i++) {
    num1 = await evalJs(`document.getElementById("intro-number-display").textContent.trim()`);
    label1 = await evalJs(`document.getElementById("intro-label-display").textContent.trim()`);
    if (num1 === "1") break;
    await new Promise((r) => setTimeout(r, 100));
  }
  console.log(`Step 1s: Number=${num1}, Label=${label1}`);
  if (num1 !== "1" || label1 !== "GO!") {
    throw new Error(`Expected 1 - GO!, got ${num1} - ${label1}`);
  }
  await takeScreenshot("test-getsetgo-4-go.png");

  console.log("\n--- STEP 5: WAITING FOR LIVE MESSAGE & GLITTER DISPLAY ---");
  let liveSplashVisible = false;
  let liveSplashText = "";
  for (let i = 0; i < 40; i++) {
    liveSplashVisible = await evalJs(`
      const splash = document.getElementById("intro-live-splash");
      splash && window.getComputedStyle(splash).display !== "none"
    `);
    if (liveSplashVisible) {
      liveSplashText = await evalJs(`document.querySelector(".live-splash-title")?.textContent.trim()`);
      break;
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  console.log("LIVE Splash visible:", liveSplashVisible);
  console.log("LIVE Splash Title:", liveSplashText);

  if (!liveSplashVisible || !liveSplashText.includes("LIVE")) {
    throw new Error("Expected LIVE Message display, but not found!");
  }
  await takeScreenshot("test-getsetgo-5-live-message.png");

  console.log("\n--- STEP 6: VERIFYING 24-HOUR COUNTDOWN SCREEN TRANSITION ---");
  await new Promise((r) => setTimeout(r, 2000));

  const isCountdown = await evalJs(`document.getElementById("screen-countdown").classList.contains("active")`);
  const hours = await evalJs(`document.getElementById("digit-hours").textContent.trim()`);
  const minutes = await evalJs(`document.getElementById("digit-minutes").textContent.trim()`);
  const seconds = await evalJs(`document.getElementById("digit-seconds").textContent.trim()`);
  const hasPhases = await evalJs(`document.querySelector(".milestones-section") !== null`);
  const has10sTester = await evalJs(`document.getElementById("btn-test-10s") !== null`);
  const metaText = await evalJs(`document.querySelector(".countdown-event-meta-line").textContent.trim()`);

  console.log("24-Hour Countdown screen active:", isCountdown);
  console.log(`Clock: ${hours}h : ${minutes}m : ${seconds}s`);
  console.log("Phases section removed:", !hasPhases);
  console.log("10s tester button removed:", !has10sTester);
  console.log("Clean metadata text (no started time):", metaText);

  if (!isCountdown || hasPhases || has10sTester || metaText.includes("Started:")) {
    throw new Error("Countdown screen elements verification failed!");
  }
  await takeScreenshot("test-getsetgo-6-countdown-clean.png");

  console.log("\n=======================================================");
  console.log(" ALL GET-SET-GO & CLEAN COUNTDOWN CHECKS PASSED!");
  console.log("=======================================================\n");

  ws.close();
  chrome.kill();
  server.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
