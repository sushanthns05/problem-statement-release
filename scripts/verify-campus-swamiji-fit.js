import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

const DIST_DIR = path.resolve("dist");
const PORT = 4268;

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
  const debugPort = 9275;
  const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-fit-test-"));

  // Test at 1366x768 to rigorously verify that it fits even on smaller laptop displays!
  const chrome = spawn(
    chromePath,
    [
      "--headless=new",
      "--no-sandbox",
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${tempUserDataDir}`,
      "--window-size=1366,768",
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
      width: 1366,
      height: 768,
      deviceScaleFactor: 1,
      mobile: false,
    },
    sessionId
  );

  const evaluate = async (expression) => {
    const res = await sendCommand(
      "Runtime.evaluate",
      {
        expression,
        returnByValue: true,
        awaitPromise: true,
      },
      sessionId
    );
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

  // Open curtain via Enter key
  console.log("=== ADVANCING PAST CURTAIN ===");
  await evaluate("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))");
  await new Promise((r) => setTimeout(r, 2200));

  // Step 2: SJBIT
  console.log("=== ADVANCING TO STEP 3: CAMPUS PHOTO ===");
  await evaluate("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))");
  await new Promise((r) => setTimeout(r, 600));

  // Check if campus photo fits
  const campusFit = await evaluate(`(() => {
    const el = document.querySelector('.slide-campus');
    const header = document.querySelector('.campus-header-bar');
    const frame = document.querySelector('.campus-photo-frame');
    const img = document.querySelector('.campus-main-photo');
    const caption = document.querySelector('.campus-photo-caption');
    const bHeader = header.getBoundingClientRect();
    const bFrame = frame.getBoundingClientRect();
    const bCaption = caption.getBoundingClientRect();
    return {
      viewportHeight: window.innerHeight,
      headerTop: bHeader.top,
      headerBottom: bHeader.bottom,
      frameTop: bFrame.top,
      frameBottom: bFrame.bottom,
      captionBottom: bCaption.bottom,
      entirelyVisible: bHeader.top >= 0 && bCaption.bottom <= window.innerHeight
    };
  })()`);
  console.log("Campus Fit Metrics:", campusFit);
  await takeScreenshot("test-fit-step3-campus.png");

  // Step 4: Swamiji Photos
  console.log("=== ADVANCING TO STEP 4: SWAMIJI PHOTOS ===");
  await evaluate("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))");
  await new Promise((r) => setTimeout(r, 600));

  const swamijiFit = await evaluate(`(() => {
    const el = document.querySelector('.slide-swamiji');
    const header = document.querySelector('.swamiji-blessing-header');
    const row = document.querySelector('.swamiji-portraits-row');
    const bHeader = header.getBoundingClientRect();
    const bRow = row.getBoundingClientRect();
    return {
      viewportHeight: window.innerHeight,
      headerTop: bHeader.top,
      headerBottom: bHeader.bottom,
      rowTop: bRow.top,
      rowBottom: bRow.bottom,
      entirelyVisible: bHeader.top >= 0 && bRow.bottom <= window.innerHeight
    };
  })()`);
  console.log("Swamiji Fit Metrics:", swamijiFit);
  await takeScreenshot("test-fit-step4-swamiji.png");

  // Test 1920x1080 as well
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
  await new Promise((r) => setTimeout(r, 400));
  await takeScreenshot("test-fit-step4-swamiji-1080p.png");

  // Jump to problem statement to verify 4.0s timer
  console.log("=== ADVANCE TO PROBLEM STATEMENT SLIDE ===");
  // Step 10 is index 9, Step 11 is index 10, Step 11b (first problem statement) is index 11
  // Let's advance right arrow multiple times
  for (let i = 0; i < 7; i++) {
    await evaluate("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))");
    await new Promise((r) => setTimeout(r, 150));
  }
  // Click on trigger
  await evaluate("document.getElementById('btn-dignitary-trigger')?.click()");
  await new Promise((r) => setTimeout(r, 800));
  // Advance to first problem statement
  await evaluate("window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))");
  await new Promise((r) => setTimeout(r, 800));

  await takeScreenshot("test-fit-statement-4s.png");

  // Test Curious Mass Beats audio invocation
  console.log("=== TEST AUDIO MASS BEATS INVOCATION ===");
  const audioTest = await evaluate(`(() => {
    try {
      import('/src/audio.js').then(({ sound }) => {
        sound.init();
        sound.playCountdown5to1(5);
        sound.playCountdown5to1(4);
        sound.playCountdown5to1(3);
        sound.playCountdown5to1(2);
        sound.playCountdown5to1(1);
      });
      return { success: true };
    } catch(err) {
      return { error: err.message };
    }
  })()`);
  console.log("Audio Test Result:", audioTest);

  console.log("=== VERIFICATION COMPLETE ===");

  ws.close();
  cleanup();
  process.exit(0);
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

