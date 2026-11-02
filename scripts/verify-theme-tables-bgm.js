import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

const DIST_DIR = path.resolve("dist");
const PORT = 4280;

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
  const debugPort = 9285;
  const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-theme-tables-test-"));

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

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await delay(300);
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
      if (res.ok) {
        const json = await res.json();
        wsUrl = json.webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    console.error("Failed to connect to Chrome remote debugger");
    cleanup();
    process.exit(1);
  }

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve) => (ws.onopen = resolve));

  let msgId = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      pending.get(data.id)(data);
      pending.delete(data.id);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = msgId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });

  const targetsRes = await send("Target.getTargets");
  const pageTarget = targetsRes.result.targetInfos.find((t) => t.type === "page");
  const attachRes = await send("Target.attachToTarget", {
    targetId: pageTarget.targetId,
    flatten: true,
  });
  const sessionId = attachRes.result.sessionId;

  const sendPage = (method, params = {}) =>
    new Promise((resolve) => {
      const id = msgId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, sessionId, method, params }));
    });

  await sendPage("Page.enable");
  await sendPage("DOM.enable");
  await sendPage("CSS.enable");

  const evalCode = async (expr) => {
    const r = await sendPage("Runtime.evaluate", { expression: expr, returnByValue: true });
    return r.result.result?.value;
  };

  const screenshot = async (filename) => {
    const r = await sendPage("Page.captureScreenshot", { format: "png" });
    const buffer = Buffer.from(r.result.data, "base64");
    fs.writeFileSync(filename, buffer);
    console.log(`[Screenshot Saved] -> ${filename}`);
  };

  const artDir = "C:\\Users\\Dell\\.gemini\\antigravity\\brain\\e09ef443-56f5-4d57-9d91-020814f19093";

  console.log("Waiting for page load...");
  await delay(1200);

  // 1. Verify Curtain (Step 1)
  console.log("Verifying Step 1: Curtain...");
  await screenshot(path.join(artDir, "test-theme-step1-curtain.png"));

  // Open curtain by evaluating click
  console.log("Opening curtain...");
  await evalCode(`document.getElementById("btn-open-curtain").click();`);
  await delay(2500);

  // 2. Verify Step 2: SJBIT
  console.log("Verifying Step 2: SJBIT...");
  await screenshot(path.join(artDir, "test-theme-step2-sjbit.png"));

  // Jump directly to Step 11: Theme 1 Table (Agriculture) by setting step
  console.log("Navigating to Step 11: Theme 1 Agriculture Table...");
  // Use Enter or ArrowRight or keyboard handler
  for (let i = 0; i < 9; i++) {
    await evalCode(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));`);
    await delay(300);
  }
  await delay(1000);

  // Check current step name
  const stepName1 = await evalCode(`document.querySelector(".theme-table-title-text")?.textContent`);
  console.log(`Current step title: ${stepName1}`);

  // Take screenshot of Theme 1 Table
  console.log("Verifying Theme 1 Table (Agriculture) with 10 problem statements & 35s timer...");
  await screenshot(path.join(artDir, "test-theme-step11-table-agriculture.png"));

  // Check how many rows are rendered in Theme 1 Table
  const rowCount1 = await evalCode(`document.querySelectorAll(".ceremony-theme-table-row").length`);
  console.log(`Theme 1 Table rows rendered: ${rowCount1} (Expected: 10)`);

  const secondsRemaining1 = await evalCode(`document.getElementById("theme-table-seconds-num")?.textContent`);
  console.log(`Theme 1 seconds remaining: ${secondsRemaining1}s`);

  // Navigate to Theme 2 Table (Smart & Sustainable Future)
  console.log("Navigating to Theme 2 Table via Next Theme button...");
  await evalCode(`document.getElementById("btn-theme-next")?.click();`);
  await delay(800);

  const stepName2 = await evalCode(`document.querySelector(".theme-table-title-text")?.textContent`);
  console.log(`Current step title: ${stepName2}`);
  const rowCount2 = await evalCode(`document.querySelectorAll(".ceremony-theme-table-row").length`);
  console.log(`Theme 2 Table rows rendered: ${rowCount2} (Expected: 10)`);
  await screenshot(path.join(artDir, "test-theme-step12-table-sustainable.png"));

  // Navigate to Theme 3 Table (Governance)
  console.log("Navigating to Theme 3 Table via Next Theme button...");
  await evalCode(`document.getElementById("btn-theme-next")?.click();`);
  await delay(800);

  const stepName3 = await evalCode(`document.querySelector(".theme-table-title-text")?.textContent`);
  console.log(`Current step title: ${stepName3}`);
  const rowCount3 = await evalCode(`document.querySelectorAll(".ceremony-theme-table-row").length`);
  console.log(`Theme 3 Table rows rendered: ${rowCount3} (Expected: 10)`);
  await screenshot(path.join(artDir, "test-theme-step13-table-governance.png"));

  // Advance to Countdown 5 to 1
  console.log("Advancing to Countdown 5 to 1...");
  await evalCode(`document.getElementById("btn-theme-next")?.click();`);
  await delay(1200);

  const countdownDigit = await evalCode(`document.getElementById("countdown-5to1-digit")?.textContent`);
  console.log(`Countdown digit: ${countdownDigit}`);
  await screenshot(path.join(artDir, "test-theme-step14-countdown.png"));

  console.log("Verification finished successfully!");
  cleanup();
  process.exit(0);
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
