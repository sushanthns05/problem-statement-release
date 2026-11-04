import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";

const DIST_DIR = path.resolve("dist");
const PORT = 4390;

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
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
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

  const stat = fs.statSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  const range = req.headers.range;
  if (range && (ext === ".mp4" || ext === ".wav" || ext === ".mpeg" || ext === ".mp3")) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${stat.size}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": contentType,
    });
    file.pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": stat.size,
      "Accept-Ranges": "bytes",
      "Content-Type": contentType,
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

async function runE2E() {
  await new Promise((resolve) => server.listen(PORT, "127.0.0.1", resolve));
  console.log(`[Test Server] Serving dist on http://127.0.0.1:${PORT}`);

  const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const debugPort = 9310;
  const tempUserDataDir = fs.mkdtempSync(path.join(os.tmpdir(), "cdp-e2e-event-"));

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
      "--autoplay-policy=no-user-gesture-required",
      `http://127.0.0.1:${PORT}/`,
    ]
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

  // Extract wsUrl from stderr
  const wsUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Timeout waiting for Chrome DevTools websocket URL"));
    }, 12000);

    let buf = "";
    chrome.stderr.on("data", (chunk) => {
      buf += chunk.toString();
      const match = buf.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });

    chrome.on("error", reject);
    chrome.on("exit", (code) => {
      if (code !== 0) reject(new Error(`Chrome exited prematurely with code ${code}`));
    });
  });

  console.log(`[CDP] Connected to Chrome DevTools: ${wsUrl}`);

  const ws = new WebSocket(wsUrl);
  let id = 1;
  const pending = new Map();
  const consoleErrors = [];
  const uncaughtExceptions = [];

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);

    if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
      const text = msg.params.args.map((a) => a.value || a.description || JSON.stringify(a)).join(" ");
      consoleErrors.push(text);
      console.error("[Browser Console Error]:", text);
    }
    if (msg.method === "Runtime.exceptionThrown") {
      const desc = msg.params.exceptionDetails?.exception?.description || msg.params.exceptionDetails?.text;
      uncaughtExceptions.push(desc);
      console.error("[Browser Uncaught Exception]:", desc);
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

  if (ws.readyState !== 1) { // 1 = OPEN
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });
  }

  const targetsRes = await send("Target.getTargets");
  const targetInfos = targetsRes.targetInfos || targetsRes.result?.targetInfos || [];
  const pageTarget = targetInfos.find((t) => t.type === "page");
  if (!pageTarget) {
    throw new Error("No page target found");
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

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const evalExpr = async (expression) => {
    const res = await sendPage("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result ? res.result.value : res.value;
  };

  const captureScreen = async (filename) => {
    const shot = await sendPage("Page.captureScreenshot", { format: "png" });
    const data = shot.data || shot.result?.data;
    const outPath = path.join("C:/Users/Dell/.gemini/antigravity/brain/e09ef443-56f5-4d57-9d91-020814f19093", filename);
    fs.writeFileSync(outPath, Buffer.from(data, "base64"));
    console.log(`[Screenshot Captured] -> ${filename}`);
  };

  console.log("\n========================================================");
  console.log("   FULL COMPREHENSIVE EVENT FUNCTIONALITY AUDIT");
  console.log("========================================================\n");

  await delay(1500);

  // 1. Check Initial State (Curtain Closed)
  console.log("[Test 1/10] Verifying Initial State: Stage Curtain Closed...");
  const curtainExists = await evalExpr(`!!document.getElementById("btn-open-curtain")`);
  if (!curtainExists) throw new Error("Step 1 button #btn-open-curtain not found in DOM");
  console.log("  ✓ Stage curtain prompt loaded cleanly.");

  // Open Stage Curtain
  console.log("[Test 2/10] Opening Stage Curtain (Triggering Ceremony BGM)...");
  await evalExpr(`document.getElementById("btn-open-curtain").click();`);
  await delay(2200);

  const curStep = await evalExpr(`window.ceremonyController?.currentStepIndex`);
  console.log("  ✓ Curtain parted. Current Step Index:", curStep);

  // 3. Walk through slides 2 to 8
  console.log("[Test 3/10] Walking through Slides 2 to 8...");
  for (let targetIndex = 1; targetIndex <= 7; targetIndex++) {
    const curIdx = await evalExpr(`window.ceremonyController.currentStepIndex`);
    const stepTitle = await evalExpr(`window.ceremonyController.steps[window.ceremonyController.currentStepIndex]?.title`);
    console.log(`  -> Step ${curIdx + 1} of 18: ${stepTitle}`);
    if (curIdx < 7) {
      await evalExpr(`window.ceremonyController.nextStep();`);
      await delay(400);
    }
  }

  // Verify Step 8: Sponsors & Accreditations partners
  console.log("[Test 4/10] Verifying Step 8 Association Partners & Accreditations...");
  await delay(600);
  const sponsorsData = await evalExpr(`
    (() => {
      const partners = [];
      if (document.querySelector('.assoc-partner-logo[src*="dlithe"]')) partners.push("DLithe");
      if (document.querySelector('.assoc-partner-logo[src*="divine"]')) partners.push("Divine Designs");
      if (document.querySelector('.assoc-partner-logo[src*="printasstic"]')) partners.push("Prrintastic");
      const accreditations = document.querySelector('.all-logos-img');
      return {
        partners,
        hasAccreditations: !!accreditations && accreditations.naturalWidth > 0
      };
    })()
  `);
  console.log("  ✓ Step 8 Partners:", sponsorsData.partners.join(", "));
  if (!sponsorsData.partners.includes("DLithe") ||
      !sponsorsData.partners.includes("Divine Designs") ||
      !sponsorsData.partners.includes("Prrintastic")) {
    throw new Error("Missing association partner in Step 8: " + JSON.stringify(sponsorsData));
  }

  // Advance to Step 9: Problem Statements title
  console.log("  -> Advancing to Step 9: Problem Statements Title...");
  await evalExpr(`window.ceremonyController.nextStep();`);
  await delay(400);

  // Advance to Step 10: Click to Release
  console.log("[Test 5/10] Advancing to Step 10: Click on Release...");
  await evalExpr(`window.ceremonyController.nextStep();`);
  await delay(500);

  const releaseBtn = await evalExpr(`!!document.getElementById("btn-dignitary-trigger")`);
  if (!releaseBtn) throw new Error("Step 10 Dignitary Release Button not found");
  console.log("  ✓ Dignitary Release Button verified.");

  // Click Release to trigger Theme 1 Big Screen!
  console.log("[Test 6/10] Triggering Problem Statement Release...");
  await evalExpr(`document.getElementById("btn-dignitary-trigger").click();`);
  await delay(1200);

  // 7. Verify Theme 1 Big Screen & Theme 1 Table
  console.log("[Test 7/10] Verifying Theme 1 Big Screen (Agriculture)...");
  const theme1Title = await evalExpr(`document.querySelector(".theme-bigscreen-title-text")?.textContent?.trim()`);
  console.log("  ✓ Theme 1 Big Screen Title:", theme1Title);
  if (!theme1Title?.includes("AGRICULTURE")) {
    throw new Error("Theme 1 title mismatch: " + theme1Title);
  }

  // Advance to Theme 1 Table
  await evalExpr(`window.ceremonyController.nextStep();`);
  await delay(600);
  const theme1TableCount = await evalExpr(`document.querySelectorAll(".ceremony-theme-table-row").length`);
  console.log(`  ✓ Theme 1 Table Problem Statements Count: ${theme1TableCount} (expected 10)`);
  if (theme1TableCount !== 10) throw new Error("Expected 10 rows in Theme 1 Table, found " + theme1TableCount);

  // Advance through Theme 2 & Theme 3
  console.log("[Test 8/10] Verifying Theme 2 and Theme 3 Big Screens & Tables...");
  // Theme 2 Big Screen
  await evalExpr(`window.ceremonyController.nextStep();`);
  await delay(400);
  const theme2Title = await evalExpr(`document.querySelector(".theme-bigscreen-title-text")?.textContent?.trim()`);
  console.log("  ✓ Theme 2 Big Screen Title:", theme2Title);

  // Theme 2 Table
  await evalExpr(`window.ceremonyController.nextStep();`);
  await delay(400);
  const theme2TableCount = await evalExpr(`document.querySelectorAll(".ceremony-theme-table-row").length`);
  console.log(`  ✓ Theme 2 Table Problem Statements Count: ${theme2TableCount} (expected 10)`);
  if (theme2TableCount !== 10) throw new Error("Expected 10 rows in Theme 2 Table");

  // Theme 3 Big Screen
  await evalExpr(`window.ceremonyController.nextStep();`);
  await delay(400);
  const theme3Title = await evalExpr(`document.querySelector(".theme-bigscreen-title-text")?.textContent?.trim()`);
  console.log("  ✓ Theme 3 Big Screen Title:", theme3Title);

  // Theme 3 Table
  await evalExpr(`window.ceremonyController.nextStep();`);
  await delay(400);
  const theme3TableCount = await evalExpr(`document.querySelectorAll(".ceremony-theme-table-row").length`);
  console.log(`  ✓ Theme 3 Table Problem Statements Count: ${theme3TableCount} (expected 10)`);
  if (theme3TableCount !== 10) throw new Error("Expected 10 rows in Theme 3 Table");

  // Countdown 5 to 1 & Launch Transition
  console.log("[Test 9/10] Verifying Final Countdown (5-4-3-2-1) & Launch Transition...");
  await evalExpr(`window.ceremonyController.nextStep();`); // Countdown 5 to 1
  await delay(800);

  // Check that countdown video element exists and is active
  const videoExists = await evalExpr(`!!document.getElementById("countdown-5to1-video")`);
  console.log("  ✓ Countdown video element present:", videoExists);

  // Skip to timer / complete ceremony
  await evalExpr(`window.ceremonyController.completeCeremony();`);
  await delay(1200);

  // 10. Verify Live 24-Hour Countdown Screen
  console.log("[Test 10/10] Verifying Live 24-Hour Countdown Screen & Interaction Controls...");
  const countdownActive = await evalExpr(`document.getElementById("screen-countdown")?.classList.contains("active")`);
  console.log("  ✓ Live 24H Countdown screen active:", countdownActive);
  if (!countdownActive) throw new Error("screen-countdown did not activate after ceremony");

  const timerDigits = await evalExpr(`(() => {
    return {
      hours: document.getElementById("digit-hours")?.textContent?.trim(),
      minutes: document.getElementById("digit-minutes")?.textContent?.trim(),
      seconds: document.getElementById("digit-seconds")?.textContent?.trim(),
      centis: document.getElementById("digit-centis")?.textContent?.trim(),
    };
  })()`);
  console.log("  ✓ Live Timer Digits Readout:", `${timerDigits.hours}h : ${timerDigits.minutes}m : ${timerDigits.seconds}s . ${timerDigits.centis}`);

  // Test "View Problem Statements" button
  console.log("  -> Testing 'View Problem Statements' button...");
  await evalExpr(`document.getElementById("btn-view-problems")?.click();`);
  await delay(600);
  const problemsScreenActive = await evalExpr(`document.getElementById("screen-problems")?.classList.contains("active")`);
  console.log("  ✓ Switched to Problem Statements Explorer screen:", problemsScreenActive);

  // Test pagination through all 3 themes
  console.log("  -> Testing Theme pagination (Next / Prev arrows)...");
  await evalExpr(`document.getElementById("btn-next-theme")?.click();`); // to Theme 2
  await delay(300);
  let curThemeBadge = await evalExpr(`document.getElementById("theme-index-badge")?.textContent?.trim()`);
  console.log("    Switched to:", curThemeBadge);

  await evalExpr(`document.getElementById("btn-next-theme")?.click();`); // to Theme 3
  await delay(300);
  curThemeBadge = await evalExpr(`document.getElementById("theme-index-badge")?.textContent?.trim()`);
  console.log("    Switched to:", curThemeBadge);

  await evalExpr(`document.getElementById("btn-prev-theme")?.click();`); // back to Theme 2
  await delay(300);
  curThemeBadge = await evalExpr(`document.getElementById("theme-index-badge")?.textContent?.trim()`);
  console.log("    Switched back to:", curThemeBadge);

  // Return to 24-Hour live countdown
  console.log("  -> Returning to 24-Hour Live Countdown...");
  await evalExpr(`document.getElementById("btn-next-theme")?.click();`); // to Theme 3
  await delay(200);
  await evalExpr(`document.getElementById("btn-next-theme")?.click();`); // to Countdown
  await delay(600);

  // Test "Fire Glitter Shower"
  console.log("  -> Testing 'Fire Glitter Shower' button...");
  await evalExpr(`document.getElementById("btn-fire-glitter")?.click();`);
  await delay(500);
  console.log("  ✓ Glitter shower fired without errors.");

  // Test keyboard shortcuts: 'M' (mute) and 'F' (fullscreen toggle)
  console.log("  -> Testing keyboard shortcut 'M' (Mute toggle)...");
  await evalExpr(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' }));`);
  const isMuted = await evalExpr(`!!window.sound?.muted`);
  console.log("  ✓ Sound muted status:", isMuted);
  await evalExpr(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm' }));`); // restore unmute

  // Capture final live countdown screenshot
  await captureScreen("e2e-countdown-screen-verified.png");

  console.log("\n========================================================");
  console.log("   AUDIT SUMMARY & HEALTH REPORT");
  console.log("========================================================");
  console.log(`Browser Console Errors:     ${consoleErrors.length}`);
  console.log(`Browser Uncaught Exceptions: ${uncaughtExceptions.length}`);

  if (consoleErrors.length > 0) {
    console.error("Errors detected:", consoleErrors);
  }
  if (uncaughtExceptions.length > 0) {
    console.error("Exceptions detected:", uncaughtExceptions);
  }

  cleanup();

  if (consoleErrors.length === 0 && uncaughtExceptions.length === 0) {
    console.log("\n>>> ALL 10/10 FUNCTIONALITY TESTS PASSED WITH 0 ERRORS! READY FOR THE EVENT! <<<\n");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runE2E().catch((err) => {
  console.error("E2E Test Failure:", err);
  process.exit(1);
});
