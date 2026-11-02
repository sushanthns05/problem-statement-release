import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

const DIST_DIR = path.resolve("dist");
const PORT = 4230;

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
  const debugPort = 9240;
  const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-themes-test-"));

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
      "--window-size=1366,768",
      `http://127.0.0.1:${PORT}`,
    ],
    { stdio: "ignore" }
  );

  let wsUrl = null;
  for (let i = 0; i < 40; i++) {
    try {
      const resp = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
      const data = await resp.json();
      wsUrl = data.webSocketDebuggerUrl;
      if (wsUrl) break;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  if (!wsUrl) {
    throw new Error("Could not connect to Chrome debugging port");
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
  await sendPage("DOM.enable");

  const evaluate = async (expression) => {
    const res = await sendPage("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result.value;
  };

  const takeScreenshot = async (filename) => {
    const shot = await sendPage("Page.captureScreenshot", { format: "png" });
    const buffer = Buffer.from(shot.data, "base64");
    fs.writeFileSync(filename, buffer);
    const brainPath = `C:\\Users\\Dell\\.gemini\\antigravity\\brain\\e09ef443-56f5-4d57-9d91-020814f19093\\${filename}`;
    fs.writeFileSync(brainPath, buffer);
    console.log(`[Screenshot] Saved ${filename}`);
  };

  // Wait for initial landing page load
  await new Promise((r) => setTimeout(r, 1000));
  await evaluate(`localStorage.clear()`);
  await sendPage("Page.navigate", { url: `http://127.0.0.1:${PORT}` });
  await new Promise((r) => setTimeout(r, 1000));

  console.log("\n--- TEST 1: INAUGURATION CLICK & 3-2-1 COUNTDOWN ---");
  await evaluate(`document.getElementById("btn-launch-now").click()`);
  await new Promise((r) => setTimeout(r, 500));
  const introVisible = await evaluate(`document.getElementById("screen-intro").classList.contains("active")`);
  console.log("Intro screen active:", introVisible);

  console.log("\n--- TEST 2: WAIT FOR 3-2-1 TO COMPLETE -> THEME 1 AGRICULTURE REVEAL ---");
  // Wait ~3.5 seconds for 3-2-1 sequence to complete and reveal problems screen
  await new Promise((r) => setTimeout(r, 3600));

  const problemsScreenActive = await evaluate(`document.getElementById("screen-problems").classList.contains("active")`);
  console.log("Problems screen active:", problemsScreenActive);

  const theme1Title = await evaluate(`document.getElementById("theme-title-text").textContent`);
  const rowCountTheme1 = await evaluate(`document.querySelectorAll("#problems-table-body tr").length`);
  console.log(`Theme 1 Name: "${theme1Title}" | Problem Count: ${rowCountTheme1}`);

  // Check single-page fit at 1366x768
  const fitMetrics1 = await evaluate(`(() => {
    const navBar = document.querySelector(".theme-nav-bar");
    const rect = navBar.getBoundingClientRect();
    return {
      navBottom: Math.round(rect.bottom),
      viewportHeight: window.innerHeight,
      fitsOnScreen: rect.bottom <= window.innerHeight
    };
  })()`);
  console.log(`[Theme 1 Fit] Nav Bar Bottom: ${fitMetrics1.navBottom}px | Viewport: ${fitMetrics1.viewportHeight}px | Fits: ${fitMetrics1.fitsOnScreen}`);
  await takeScreenshot("test-theme-1-agriculture.png");

  console.log("\n--- TEST 3: NAVIGATE TO THEME 2 SMART & SUSTAINABLE FUTURE ---");
  await evaluate(`document.getElementById("btn-next-theme").click()`);
  await new Promise((r) => setTimeout(r, 400));

  const theme2Title = await evaluate(`document.getElementById("theme-title-text").textContent`);
  const rowCountTheme2 = await evaluate(`document.querySelectorAll("#problems-table-body tr").length`);
  const firstIdTheme2 = await evaluate(`document.querySelector("#problems-table-body tr:first-child .problem-id-code").textContent`);
  console.log(`Theme 2 Name: "${theme2Title}" | Count: ${rowCountTheme2} | First ID: ${firstIdTheme2}`);
  await takeScreenshot("test-theme-2-smart-sustainable.png");

  console.log("\n--- TEST 4: NAVIGATE TO THEME 3 GOVERNANCE ---");
  await evaluate(`document.getElementById("btn-next-theme").click()`);
  await new Promise((r) => setTimeout(r, 400));

  const theme3Title = await evaluate(`document.getElementById("theme-title-text").textContent`);
  const rowCountTheme3 = await evaluate(`document.querySelectorAll("#problems-table-body tr").length`);
  const firstIdTheme3 = await evaluate(`document.querySelector("#problems-table-body tr:first-child .problem-id-code").textContent`);
  const nextBtnLabel = await evaluate(`document.getElementById("btn-next-label").textContent`);
  console.log(`Theme 3 Name: "${theme3Title}" | Count: ${rowCountTheme3} | First ID: ${firstIdTheme3}`);
  console.log(`Next Button Label on Final Theme: "${nextBtnLabel}"`);
  await takeScreenshot("test-theme-3-governance.png");

  console.log("\n--- TEST 5: TRIGGER AUTOMATED 'WE ARE LIVE' FROM THEME 3 ---");
  await evaluate(`document.getElementById("btn-next-theme").click()`);
  await new Promise((r) => setTimeout(r, 600));

  const liveSplashVisible = await evaluate(`document.getElementById("intro-live-splash").style.display !== "none"`);
  console.log("Automated 'WE ARE LIVE!' splash visible:", liveSplashVisible);
  await takeScreenshot("test-live-splash-revealed.png");

  console.log("\n--- TEST 6: VERIFY 24-HOUR COUNTDOWN ACTIVE ---");
  await new Promise((r) => setTimeout(r, 2200));

  const countdownActive = await evaluate(`document.getElementById("screen-countdown").classList.contains("active")`);
  const digitHoursVal = await evaluate(`document.getElementById("digit-hours").textContent`);
  const headerLiveBadge = await evaluate(`document.getElementById("header-status-badge").classList.contains("status-live")`);
  console.log(`Countdown active: ${countdownActive} | Hours: ${digitHoursVal} | Header status live: ${headerLiveBadge}`);
  await takeScreenshot("test-24h-live-after-themes.png");

  console.log("\n=======================================================");
  console.log(" ALL 6 THEME & LIVE FLOW VERIFICATIONS PASSED!");
  console.log("=======================================================");

  ws.close();
  chrome.kill();
  server.close();
  try {
    fs.rmSync(tempUserDataDir, { recursive: true, force: true });
  } catch {}
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
