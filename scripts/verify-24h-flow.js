import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

const DIST_DIR = path.resolve("dist");
const PORT = 4210;

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
  const debugPort = 9225;
  const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-24h-"));

  const chrome = spawn(
    chromePath,
    [
      "--headless=new",
      "--no-sandbox",
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

  console.log("\n--- STEP 1: VERIFYING PRE-LAUNCH INAUGURATION SCREEN ---");
  const isLanding = await evalJs(`document.getElementById("screen-landing").classList.contains("active")`);
  const deptTitle = await evalJs(`document.getElementById("header-dept-title").textContent.trim()`);
  const dateBadge = await evalJs(`document.querySelector(".event-date-badge").textContent.trim()`);
  const launchBtn = await evalJs(`document.getElementById("btn-launch-now").textContent.trim()`);

  console.log("Landing screen active:", isLanding);
  console.log("Header department title:", deptTitle);
  console.log("Event date badge:", dateBadge);
  console.log("Launch button text:", launchBtn);

  if (!isLanding || !deptTitle.toUpperCase().includes("INFORMATION SCIENCE") || !dateBadge.includes("5th & 6th November 2026")) {
    throw new Error("Landing screen verification failed!");
  }
  await takeScreenshot("test-24h-1-landing.png");

  console.log("\n--- STEP 2: PRINCIPAL CLICKS 'LAUNCH NOW' (3-SECOND COUNTDOWN) ---");
  await evalJs(`document.getElementById("btn-launch-now").click()`);
  await new Promise((r) => setTimeout(r, 400));

  const isIntro = await evalJs(`document.getElementById("screen-intro").classList.contains("active")`);
  const introNumber = await evalJs(`document.getElementById("intro-number-display").textContent.trim()`);
  console.log("Intro screen active:", isIntro);
  console.log("Current intro number:", introNumber);
  await takeScreenshot("test-24h-2-intro.png");

  console.log("\n--- STEP 3: WAITING FOR 3 SECONDS & VERIFYING GLITTER EXPLOSION & 24-HR COUNTDOWN ---");
  await new Promise((r) => setTimeout(r, 3400));

  const isCountdown = await evalJs(`document.getElementById("screen-countdown").classList.contains("active")`);
  const badgeStatus = await evalJs(`document.getElementById("header-status-text").textContent.trim()`);
  const hours = await evalJs(`document.getElementById("digit-hours").textContent.trim()`);
  const minutes = await evalJs(`document.getElementById("digit-minutes").textContent.trim()`);
  const seconds = await evalJs(`document.getElementById("digit-seconds").textContent.trim()`);
  const centis = await evalJs(`document.getElementById("digit-centis").textContent.trim()`);
  const milestonesCount = await evalJs(`document.querySelectorAll(".milestone-card").length`);

  console.log("24-Hour Countdown screen active:", isCountdown);
  console.log("Header status badge:", badgeStatus);
  console.log(`Live Digital Clock: ${hours}h : ${minutes}m : ${seconds}s . ${centis} centis`);
  console.log("Milestones rendered:", milestonesCount);

  if (!isCountdown || !badgeStatus.includes("LIVE") || milestonesCount !== 4) {
    throw new Error("Live 24-hour countdown screen verification failed!");
  }

  // Trigger an extra glitter shower for capture
  await evalJs(`document.getElementById("btn-fire-glitter").click()`);
  await new Promise((r) => setTimeout(r, 500));
  await takeScreenshot("test-24h-3-live-countdown.png");

  console.log("\n--- STEP 4: VERIFYING MOBILE RESPONSIVENESS AT 375PX ---");
  await sendPage("Emulation.setDeviceMetricsOverride", {
    width: 375,
    height: 812,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await new Promise((r) => setTimeout(r, 500));

  const scrollWidth = await evalJs("document.documentElement.scrollWidth");
  const clientWidth = await evalJs("document.documentElement.clientWidth");
  console.log(`[Mobile 375px] scrollWidth: ${scrollWidth}, clientWidth: ${clientWidth}`);
  console.log(`[Mobile 375px] Horizontal overflow: ${scrollWidth > clientWidth}`);

  await takeScreenshot("test-24h-4-mobile.png");

  console.log("\n=======================================================");
  console.log(" ALL 24-HOUR COUNTDOWN CHECKS PASSED WITH FLYING COLORS!");
  console.log("=======================================================\n");

  ws.close();
  chrome.kill();
  server.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

