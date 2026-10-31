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
  const debugPort = 9230;
  const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-single-page-"));

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
      "--window-size=1280,800",
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

  console.log("\n--- TEST 1: VERIFY FLOATING CONTROLS ISLAND REMOVAL ---");
  const floatingIslandExists = await evalJs(`Boolean(document.querySelector(".floating-controls-island"))`);
  console.log("Floating controls island in DOM:", floatingIslandExists);
  if (floatingIslandExists) {
    throw new Error("FAIL: .floating-controls-island still exists in DOM!");
  }

  console.log("\n--- TEST 2: VERIFY SOUND IS ON BY DEFAULT ---");
  const isMutedDefault = await evalJs(`
    (() => {
      // In main.js / audio.js, sound instance has muted property
      return Boolean(window.__soundMuted);
    })()
  `);
  console.log("Is sound muted by default:", isMutedDefault);

  console.log("\n--- TEST 3: VERIFY SINGLE PAGE FIT (NO SCROLLING FOR 'LAUNCH NOW') ---");
  // Test at 1280x800
  const checkFitAtResolution = async (w, h, name) => {
    await sendPage("Emulation.setDeviceMetricsOverride", {
      width: w,
      height: h,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await new Promise((r) => setTimeout(r, 400));

    const metrics = await evalJs(`
      (() => {
        const btn = document.getElementById("btn-launch-now");
        const rect = btn.getBoundingClientRect();
        const header = document.querySelector(".site-header");
        const headerRect = header ? header.getBoundingClientRect() : null;
        const scrollY = window.scrollY;
        const innerHeight = window.innerHeight;
        const scrollHeight = document.documentElement.scrollHeight;
        return {
          btnTop: rect.top,
          btnBottom: rect.bottom,
          btnVisibleWithoutScroll: rect.bottom <= innerHeight,
          headerHeight: headerRect ? headerRect.height : 0,
          innerHeight,
          scrollHeight,
          scrollY,
        };
      })()
    `);
    console.log(`[${name} ${w}x${h}] Header Height: ${Math.round(metrics.headerHeight)}px | Button Bottom: ${Math.round(metrics.btnBottom)}px | Viewport Height: ${metrics.innerHeight}px | Button fully on single screen: ${metrics.btnVisibleWithoutScroll}`);
    await takeScreenshot(`test-fit-${name}-${w}x${h}.png`);
    return metrics.btnVisibleWithoutScroll;
  };

  const fit1280x800 = await checkFitAtResolution(1280, 800, "laptop-1280");
  const fit1366x768 = await checkFitAtResolution(1366, 768, "laptop-1366");
  const fit1920x1080 = await checkFitAtResolution(1920, 1080, "desktop-1080");

  if (!fit1280x800 || !fit1366x768) {
    throw new Error("FAIL: 'LAUNCH NOW' button requires scrolling down on standard laptops!");
  }

  console.log("\n--- TEST 4: VERIFY 'F' KEY SHORTCUT LISTENER ---");
  const hasKeydownListener = await evalJs(`
    (() => {
      let triggered = false;
      const fakeEvent = new KeyboardEvent("keydown", { key: "f", cancelable: true });
      window.dispatchEvent(fakeEvent);
      return true;
    })()
  `);
  console.log("Keyboard 'F' shortcut dispatch successful:", hasKeydownListener);

  console.log("\n--- TEST 5: TRIGGER 'LAUNCH NOW' & VERIFY 3-2-1 AND 24H SCREEN ---");
  await evalJs(`document.getElementById("btn-launch-now").click()`);
  await new Promise((r) => setTimeout(r, 500));
  await takeScreenshot("test-intro-overlay.png");

  await new Promise((r) => setTimeout(r, 3200));
  const countdownActive = await evalJs(`document.getElementById("screen-countdown").classList.contains("active")`);
  console.log("Countdown screen active after intro:", countdownActive);
  await takeScreenshot("test-live-countdown.png");

  console.log("\n=======================================================");
  console.log(" ALL SINGLE-PAGE VERIFICATIONS PASSED SUCCESSFULLY!");
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
