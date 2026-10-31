import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

const DIST_DIR = path.resolve("dist");
const PORT = 4192;

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

  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const debugPort = 9223;
  const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-mobile-"));

  const chrome = spawn(
    chromePath,
    [
      "--headless=new",
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${tempUserDataDir}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--window-size=375,812", // iPhone dimensions
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

  await new Promise((r) => setTimeout(r, 1000));

  const scrollWidth = await evalJs("document.documentElement.scrollWidth");
  const clientWidth = await evalJs("document.documentElement.clientWidth");
  console.log(`[Mobile Test 375px] scrollWidth: ${scrollWidth}, clientWidth: ${clientWidth}`);

  const hasHorizontalScroll = scrollWidth > clientWidth;
  console.log(`[Mobile Test 375px] Horizontal overflow: ${hasHorizontalScroll}`);

  const { data } = await sendPage("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("test-mobile-375px.png", Buffer.from(data, "base64"));
  console.log("[Mobile Screenshot] Saved test-mobile-375px.png");

  // Also test reveal screen on mobile
  await evalJs(`document.getElementById("btn-test-release-now")?.click() || (window.setScreen && window.setScreen("REVEAL"))`);
  await evalJs(`
    const btn = document.getElementById("btn-launch-now");
    btn.click();
  `);
  await new Promise((r) => setTimeout(r, 500));
  await evalJs(`document.getElementById("btn-skip-intro").click()`);
  await new Promise((r) => setTimeout(r, 500));
  await evalJs(`document.getElementById("btn-test-release-now").click()`);
  await new Promise((r) => setTimeout(r, 500));

  const { data: revealMobileData } = await sendPage("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("test-mobile-reveal-375px.png", Buffer.from(revealMobileData, "base64"));
  console.log("[Mobile Screenshot] Saved test-mobile-reveal-375px.png");

  const revealScrollWidth = await evalJs("document.documentElement.scrollWidth");
  console.log(`[Mobile Reveal 375px] scrollWidth: ${revealScrollWidth}`);

  ws.close();
  chrome.kill();
  server.close();
  process.exit(0);
}

main().catch((e) => {
  console.error("Mobile test error:", e);
  process.exit(1);
});

