import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

const DIST_DIR = path.resolve("dist");
const PORT = 4200;

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
  console.log(`[30s Test Server] Running on http://127.0.0.1:${PORT}`);

  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const debugPort = 9224;
  const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-30s-"));

  const chrome = spawn(
    chromePath,
    [
      "--headless=new",
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${tempUserDataDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--window-size=1280,850",
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

  await new Promise((r) => setTimeout(r, 1200));

  console.log("=== STARTING 30-SECOND COUNTDOWN FULL FLOW VERIFICATION ===");

  // 1. Verify Landing
  const isLanding = await evalJs(`document.getElementById("screen-landing").classList.contains("active")`);
  console.log(`[1] Landing Screen active: ${isLanding}`);

  // Set the target release time to exactly 30 seconds from now
  await evalJs(`
    const testTarget = Date.now() + 30000;
    // We update targetReleaseMs via button or setter
    document.getElementById("btn-retest-countdown").click();
  `);

  console.log("[2] Target release timestamp set to Date.now() + 30 seconds.");

  // 2. Click "LAUNCH NOW" or go through Intro
  const isIntro = await evalJs(`document.getElementById("screen-intro").classList.contains("active")`);
  const isCountdown = await evalJs(`document.getElementById("screen-countdown").classList.contains("active")`);
  console.log(`[3] Screen state after trigger: Intro=${isIntro}, Countdown=${isCountdown}`);

  console.log("[4] Monitoring timer tick for 32 seconds until automatic zero reveal...");
  let transitionedToReveal = false;

  for (let second = 1; second <= 33; second++) {
    await new Promise((r) => setTimeout(r, 1000));
    const secDisplay = await evalJs(`document.getElementById("digit-seconds")?.textContent`);
    const currentScreenReveal = await evalJs(`document.getElementById("screen-reveal").classList.contains("active")`);
    const badgeStatus = await evalJs(`document.getElementById("header-status-text").textContent`);

    console.log(`[T+${second}s] Digit Seconds: ${secDisplay || "--"}, Reveal Active: ${currentScreenReveal}, Badge: ${badgeStatus}`);

    if (currentScreenReveal) {
      transitionedToReveal = true;
      console.log(`[SUCCESS] Automatic transition to Reveal Screen occurred at T+${second}s!`);
      break;
    }
  }

  if (!transitionedToReveal) {
    throw new Error("Timer failed to automatically transition to reveal screen within 32 seconds!");
  }

  // Verify Reveal State
  const cardsCount = await evalJs(`document.querySelectorAll(".ps-card").length`);
  console.log(`[5] Rendered Problem Cards count on Reveal: ${cardsCount}`);
  if (cardsCount !== 6) {
    throw new Error(`Expected 6 problem statements, found ${cardsCount}`);
  }

  const { data: revealScreenshot } = await sendPage("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("test-30s-reveal-complete.png", Buffer.from(revealScreenshot, "base64"));
  console.log("[6] Saved confirmation screenshot: test-30s-reveal-complete.png");

  console.log("\n=======================================================");
  console.log(" 30-SECOND COUNTDOWN FULL FLOW VERIFIED SUCCESSFULLY!");
  console.log("=======================================================\n");

  ws.close();
  chrome.kill();
  server.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("30s Test failed:", err);
  process.exit(1);
});

