import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

const DIST_DIR = path.resolve("dist");
const PORT = 4288;

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
  const debugPort = 9295;
  const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-sponsors-test-"));

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

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  let wsUrl = null;
  for (let i = 0; i < 20; i++) {
    await delay(300);
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

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
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

  console.log("Opening curtain...");
  await evalExpr(`document.getElementById("btn-open-curtain")?.click();`);
  await delay(2000);

  // Navigate to Step 8: Sponsors & Accreditations (from Step 2, 6 ArrowRights)
  console.log("[Test] Navigating to Step 8: Sponsors & Accreditations...");
  for (let i = 0; i < 6; i++) {
    await evalExpr(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));`);
    await delay(300);
  }

  await delay(1500); // Allow slide fold animation to complete

  // Evaluate visible elements
  const info = await evalExpr(`
    (() => {
      const dlitheLogo = document.querySelector('.assoc-partner-logo[src*="dlithe"]');
      const names = Array.from(document.querySelectorAll('.assoc-partner-name')).map(el => el.textContent.trim());
      const roles = Array.from(document.querySelectorAll('.assoc-partner-role')).map(el => el.textContent.trim());
      const cols = Array.from(document.querySelectorAll('.assoc-partner-col')).map(el => {
        const r = el.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      });

      return {
        hasDlitheLogo: !!dlitheLogo && dlitheLogo.naturalWidth > 0,
        names,
        roles,
        cols
      };
    })()
  `);

  console.log("[Test Result] Step 8 Partner Data:\n", JSON.stringify(info, null, 2));

  // Capture full screenshot
  const shot = await sendPage("Page.captureScreenshot", { format: "png" });
  const data = shot.data || shot.result?.data;
  const outPath = "C:/Users/Dell/.gemini/antigravity/brain/e09ef443-56f5-4d57-9d91-020814f19093/sponsors-step8-verified.png";
  fs.writeFileSync(outPath, Buffer.from(data, "base64"));
  console.log(`[Screenshot Saved] -> ${outPath}`);

  cleanup();
  process.exit(0);
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
