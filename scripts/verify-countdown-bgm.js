import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

const DIST_DIR = path.resolve("dist");
const PORT = 4289;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".mpeg": "audio/mpeg",
  ".mp3": "audio/mpeg",
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
  const debugPort = 9296;
  const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-countdown-test-"));

  const chrome = spawn(
    chromePath,
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      "--disable-dev-shm-usage",
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
  process.on("SIGINT", () => {
    cleanup();
    process.exit(1);
  });

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await delay(200);
    try {
      const res = await fetch(`http://127.0.0.1:${debugPort}/json/version`);
      if (res.ok) {
        const data = await res.json();
        wsUrl = data.webSocketDebuggerUrl;
        break;
      }
    } catch {}
  }

  if (!wsUrl) {
    console.error("Failed to connect to Chrome debugging port");
    cleanup();
    process.exit(1);
  }

  const ws = new WebSocket(wsUrl);
  let id = 1;
  const pending = new Map();
  const consoleErrors = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === "Runtime.consoleAPICalled" && msg.params?.type === "error") {
      const text = msg.params.args.map((a) => a.value || a.description || "").join(" ");
      consoleErrors.push(text);
    }
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

  await new Promise((resolve) => (ws.onopen = resolve));

  const targetsRes = await send("Target.getTargets");
  const targetInfos = targetsRes.targetInfos || targetsRes.result?.targetInfos || [];
  const pageTarget = targetInfos.find((t) => t.type === "page");
  if (!pageTarget) {
    throw new Error("No page target found: " + JSON.stringify(targetsRes));
  }
  const attachRes = await send("Target.attachToTarget", {
    targetId: pageTarget.targetId,
    flatten: true,
  });
  const sessionId = attachRes.sessionId || attachRes.result?.sessionId;

  const sendPage = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, sessionId, method, params }));
    });

  await sendPage("Page.enable");
  await sendPage("Runtime.enable");

  const evalExpr = async (expression) => {
    const res = await sendPage("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result ? res.result.value : res.value;
  };

  await delay(1200);

  // 1. Click "OPEN STAGE CURTAIN" button to enter ceremony
  console.log("Opening curtain...");
  const curtainClicked = await evalExpr(`
    (() => {
      const btn = document.querySelector("#btn-open-curtain");
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    })()
  `);
  console.log("Curtain clicked:", curtainClicked);
  await delay(1200);

  // 2. Jump directly to Step 17 (Countdown 5 to 1: step index 16)
  console.log("Navigating to Step 17 (Countdown)...");
  const navigated = await evalExpr(`
    (() => {
      if (window.ceremonyController) {
        window.ceremonyController.goToStep(16);
        return true;
      }
      return false;
    })()
  `);
  console.log("Navigated to Step 17:", navigated);
  await delay(600);

  // 3. Inspect Step 17 DOM elements
  const audit = await evalExpr(`
    (() => {
      const slide = document.querySelector(".slide-countdown-5to1");
      const digit = document.querySelector("#countdown-5to1-digit");
      const tag = document.querySelector(".countdown-5to1-tag");
      const ring = document.querySelector(".countdown-5to1-ring-container");
      const label = document.querySelector(".countdown-5to1-action-label");
      const eventSub = document.querySelector(".countdown-5to1-event");

      let digitStyle = null;
      if (digit) {
        const comp = window.getComputedStyle(digit);
        digitStyle = {
          fontFamily: comp.fontFamily,
          fontSize: comp.fontSize,
          color: comp.color,
          fontWeight: comp.fontWeight
        };
      }

      return {
        slideExists: !!slide,
        digitText: digit ? digit.textContent : null,
        digitStyle,
        hasTag: !!tag,
        hasRing: !!ring,
        hasLabel: !!label,
        hasEventSubtitle: !!eventSub
      };
    })()
  `);

  console.log("[Countdown Audit Result]:", JSON.stringify(audit, null, 2));

  // Assertions
  if (!audit.slideExists) {
    throw new Error("FAIL: Step 17 slide (.slide-countdown-5to1) was not found in DOM!");
  }
  if (!audit.digitText) {
    throw new Error("FAIL: Countdown digit (#countdown-5to1-digit) not found or empty!");
  }
  if (audit.hasTag || audit.hasRing || audit.hasLabel || audit.hasEventSubtitle) {
    throw new Error("FAIL: Fancy typography elements detected! Required to be clean numerals only.");
  }
  console.log("SUCCESS: Fancy type removed, clean countdown digit confirmed!");

  // 4. Capture screenshot of clean countdown numeral
  const screenshotRes = await sendPage("Page.captureScreenshot", { format: "png" });
  const artifactDir = "C:\\Users\\Dell\\.gemini\\antigravity\\brain\\e09ef443-56f5-4d57-9d91-020814f19093";
  const screenshotPath = path.join(artifactDir, "countdown-clean-verified.png");
  fs.writeFileSync(screenshotPath, Buffer.from(screenshotRes.data, "base64"));
  console.log(`Saved screenshot to: ${screenshotPath}`);

  // 5. Check console messages for errors
  if (consoleErrors.length > 0) {
    console.error("Errors found in console:", consoleErrors);
  } else {
    console.log("SUCCESS: Zero console errors during countdown test!");
  }

  cleanup();
  console.log("Countdown test completed successfully!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
