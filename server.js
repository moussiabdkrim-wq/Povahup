const express = require("express");
const { spawn } = require("child_process");

const app = express();
app.use(express.json({ limit: "10kb" }));

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({
    app: "PureSave",
    status: "online",
    downloader: "yt-dlp",
    message: "PureSave server is running"
  });
});

app.post("/api/download", (req, res) => {
  const { url } = req.body || {};

  if (!url || typeof url !== "string") {
    return res.status(400).json({
      success: false,
      message: "Please provide a video URL"
    });
  }

  let parsed;

  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({
      success: false,
      message: "Invalid URL"
    });
  }

  if (
    !["http:", "https:"].includes(parsed.protocol) ||
    !parsed.hostname.includes(".") ||
    parsed.hostname === "localhost"
  ) {
    return res.status(400).json({
      success: false,
      message: "Unsupported URL"
    });
  }

  res.setHeader(
    "Content-Type",
    "application/octet-stream"
  );

  res.setHeader(
    "Content-Disposition",
    'attachment; filename="puresave-video"'
  );

  const downloader = spawn("yt-dlp", [
    "--no-playlist",
    "--no-warnings",
    "--no-progress",
    "-f",
    "best",
    "-o",
    "-",
    "--",
    url
  ]);

  let finished = false;

  const timeout = setTimeout(() => {
    if (!finished) {
      downloader.kill("SIGTERM");
      if (!res.headersSent) {
        res.status(504).json({
          success: false,
          message: "Download timed out"
        });
      } else {
        res.destroy();
      }
    }
  }, 120000);

  downloader.stdout.pipe(res);

  downloader.on("error", () => {
    finished = true;
    clearTimeout(timeout);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: "Downloader could not start"
      });
    } else {
      res.destroy();
    }
  });

  downloader.on("close", (code) => {
    finished = true;
    clearTimeout(timeout);

    if (code !== 0 && !res.writableEnded) {
      res.destroy();
    }
  });

  res.on("close", () => {
    if (!finished) {
      downloader.kill("SIGTERM");
      clearTimeout(timeout);
    }
  });
});

app.listen(PORT, () => {
  console.log(`PureSave server listening on ${PORT}`);
});
