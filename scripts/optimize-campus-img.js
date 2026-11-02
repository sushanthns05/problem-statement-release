import http from "node:http";
import fs from "node:fs";
import { spawn } from "node:child_process";

const server = http.createServer((req, res) => {
  if (req.url === "/img") {
    res.writeHead(200, { "Content-Type": "image/jpeg" });
    fs.createReadStream("public/assets/sjbit-campus.jpg").pipe(res);
  } else {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(`
      <!DOCTYPE html>
      <html><body>
      <canvas id="c" width="1920" height="1080"></canvas>
      <script>
        const img = new Image();
        img.src = "/img";
        img.onload = () => {
          const c = document.getElementById("c");
          const ctx = c.getContext("2d");
          ctx.drawImage(img, 0, 0, 1920, 1080);
          window.DATA_URL = c.toDataURL("image/jpeg", 0.88);
          window.DONE = true;
        };
      </script>
      </body></html>
    `);
  }
});

server.listen(4892, "127.0.0.1", async () => {
  const chrome = spawn("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", [
    "--headless=new",
    "--no-sandbox",
    "--remote-debugging-port=9492",
    "http://127.0.0.1:4892/",
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  const httpGet = (url) =>
    new Promise((resolve, reject) => {
      http
        .get(url, (res) => {
          let data = "";
          res.on("data", (d) => (data += d));
          res.on("end", () => resolve(JSON.parse(data)));
        })
        .on("error", reject);
    });

  const tabs = await httpGet("http://127.0.0.1:9492/json");
  const pageTab = tabs.find((t) => t.type === "page");
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);

  ws.addEventListener("open", () => {
    let id = 1;
    const send = (method, params = {}) => ws.send(JSON.stringify({ id: id++, method, params }));

    send("Runtime.enable");
    const checkInterval = setInterval(() => {
      send("Runtime.evaluate", { expression: "window.DONE ? window.DATA_URL : null" });
    }, 400);

    ws.addEventListener("message", (event) => {
      const res = JSON.parse(event.data);
      if (res.result && res.result.result && res.result.result.value) {
        clearInterval(checkInterval);
        const dataUrl = res.result.result.value;
        const base64 = dataUrl.split(",")[1];
        fs.writeFileSync("public/assets/sjbit-campus-hd.jpg", Buffer.from(base64, "base64"));
        console.log("SUCCESS: Saved sjbit-campus-hd.jpg:", fs.statSync("public/assets/sjbit-campus-hd.jpg").size);
        ws.close();
        chrome.kill();
        server.close();
        process.exit(0);
      }
    });
  });
});
