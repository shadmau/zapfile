import express, { Request, Response } from "express";
import cors from "cors";
import multer from "multer";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { initDb, saveFileMetadata, getFileMetadata, incrementDownloadCount } from "./database.js";
import { isIpAllowed, getClientIp } from "./ip-check.js";
import { UPLOAD_DIR, MAX_FILE_SIZE, MAX_TOTAL_FILES, PORT } from "./config.js";

const app = express();

app.use(cors());
app.use(express.json());

initDb();

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const hash = crypto.randomBytes(16).toString("hex");
    const ext = path.extname(file.originalname);
    cb(null, `${hash}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
});

app.post("/api/upload", upload.single("file"), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const existingFiles = fs.readdirSync(UPLOAD_DIR);
    if (existingFiles.length >= MAX_TOTAL_FILES) {
      fs.unlinkSync(req.file.path);
      return res.status(507).json({
        error: `Storage limit reached. Maximum ${MAX_TOTAL_FILES} files allowed.`
      });
    }

    const fileBuffer = fs.readFileSync(req.file.path);
    const hash = crypto
      .createHash("sha256")
      .update(fileBuffer)
      .update(Date.now().toString())
      .digest("hex")
      .substring(0, 24);

    const ext = path.extname(req.file.originalname);
    const newFilename = `${hash}${ext}`;
    const newPath = path.join(UPLOAD_DIR, newFilename);
    fs.renameSync(req.file.path, newPath);

    const success = saveFileMetadata(
      hash,
      req.file.originalname,
      newPath,
      req.file.size,
      req.file.mimetype
    );

    if (!success) {
      return res.status(500).json({ error: "Failed to save file metadata" });
    }

    res.json({
      hash,
      filename: req.file.originalname,
      size: req.file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

app.get("/api/download/:hash/check", (req: Request, res: Response) => {
  try {
    const { hash } = req.params;
    const clientIp = getClientIp(req.headers, req.socket.remoteAddress);
    const file = getFileMetadata(hash);

    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    const allowed = isIpAllowed(clientIp);

    res.json({
      allowed,
      file_info: {
        filename: file.filename,
        size: file.filesize,
      },
    });
  } catch (error) {
    console.error("Check error:", error);
    res.status(500).json({ error: "Failed to check access" });
  }
});

app.get("/api/download/:hash", (req: Request, res: Response) => {
  try {
    const { hash } = req.params;
    const clientIp = getClientIp(req.headers, req.socket.remoteAddress);
    const file = getFileMetadata(hash);

    if (!file) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>File Not Found - Zapfile</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: system-ui, -apple-system, sans-serif;
              background: #09090b;
              color: #fafafa;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .container {
              max-width: 500px;
              text-align: center;
              padding: 2rem;
            }
            .icon {
              width: 80px;
              height: 80px;
              margin: 0 auto 1.5rem;
              background: rgba(239, 68, 68, 0.1);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            h1 {
              font-size: 2rem;
              margin-bottom: 1rem;
              color: #fafafa;
            }
            p {
              font-size: 1rem;
              line-height: 1.75;
              color: #d4d4d8;
              margin-bottom: 1.5rem;
            }
            .error-code {
              color: #ef4444;
              font-weight: 600;
            }
            .back-btn {
              display: inline-block;
              padding: 0.75rem 1.5rem;
              background: rgba(249, 115, 22, 0.1);
              border: 1px solid rgba(249, 115, 22, 0.2);
              border-radius: 0.5rem;
              color: #fb923c;
              text-decoration: none;
              font-weight: 500;
              transition: all 0.2s;
            }
            .back-btn:hover {
              background: rgba(249, 115, 22, 0.2);
              border-color: rgba(249, 115, 22, 0.4);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
            </div>
            <h1>File Not Found</h1>
            <p>
              <span class="error-code">404:</span> This file doesn't exist or may have been deleted.
            </p>
            <p style="font-size: 0.875rem; color: #71717a;">
              The link you followed is invalid or the file is no longer available.
            </p>
            <a href="https://zapfile.dev" class="back-btn">Go to Zapfile</a>
          </div>
        </body>
        </html>
      `);
    }

    // Check if IP is allowed
    if (!isIpAllowed(clientIp)) {
      // Return HTML message instead of JSON error
      return res.status(403).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Access Restricted - Zapfile</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              font-family: system-ui, -apple-system, sans-serif;
              background: #09090b;
              color: #fafafa;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .container {
              max-width: 500px;
              text-align: center;
              padding: 2rem;
            }
            .icon {
              width: 64px;
              height: 64px;
              margin: 0 auto 1.5rem;
              background: rgba(249, 115, 22, 0.1);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            h1 {
              font-size: 2rem;
              margin-bottom: 1rem;
              color: #fafafa;
            }
            p {
              font-size: 1rem;
              line-height: 1.75;
              color: #d4d4d8;
              margin-bottom: 1rem;
            }
            .claude {
              color: #fb923c;
              font-weight: 600;
            }
            .steps {
              text-align: left;
              margin: 2rem auto;
              max-width: 400px;
            }
            .step {
              display: flex;
              gap: 0.75rem;
              margin-bottom: 1rem;
              align-items: flex-start;
            }
            .step-number {
              background: rgba(249, 115, 22, 0.2);
              color: #fb923c;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 0.875rem;
              font-weight: 600;
              flex-shrink: 0;
            }
            .step-text {
              color: #d4d4d8;
              font-size: 0.9375rem;
              line-height: 1.5;
            }
            .copy-btn {
              background: rgba(249, 115, 22, 0.1);
              padding: 2px 8px;
              border-radius: 4px;
              color: #fb923c;
              font-size: 0.875rem;
              display: inline;
              margin: 0 2px;
              cursor: pointer;
              border: 1px solid rgba(249, 115, 22, 0.2);
              transition: all 0.2s;
            }
            .copy-btn:hover {
              background: rgba(249, 115, 22, 0.2);
              border-color: rgba(249, 115, 22, 0.4);
            }
            .copy-btn:active {
              transform: scale(0.95);
            }
            .file-info {
              background: rgba(39, 39, 42, 0.5);
              border: 1px solid #27272a;
              border-radius: 0.5rem;
              padding: 1rem;
              margin-top: 1.5rem;
              font-size: 0.875rem;
            }
            .file-name {
              font-weight: 500;
              margin-bottom: 0.25rem;
            }
            .file-size {
              color: #71717a;
            }
          </style>
          <script>
            function copyUrl() {
              navigator.clipboard.writeText(window.location.href).then(() => {
                const btn = document.querySelector('.copy-btn');
                const originalText = btn.textContent;
                btn.textContent = 'Copied!';
                setTimeout(() => {
                  btn.textContent = originalText;
                }, 2000);
              }).catch(err => {
                console.error('Failed to copy:', err);
              });
            }
          </script>
        </head>
        <body>
          <div class="container">
            <div class="icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fb923c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h1>Download via Claude Code Web</h1>
            <p>
              This file can only be downloaded through <span class="claude">Claude Code Web</span>.
            </p>
            <div class="steps">
              <div class="step">
                <div class="step-number">1</div>
                <div class="step-text"><span class="copy-btn" onclick="copyUrl()">Copy</span> this page's URL</div>
              </div>
              <div class="step">
                <div class="step-number">2</div>
                <div class="step-text">Open <span class="claude">Claude Code Web</span> and paste the link in the chat</div>
              </div>
              <div class="step">
                <div class="step-number">3</div>
                <div class="step-text">Claude will download the file and use it in your project</div>
              </div>
            </div>
            <div class="file-info">
              <div class="file-name">File: ${file.filename}</div>
              <div class="file-size">Size: ${(file.filesize / 1024).toFixed(2)} KB</div>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    if (!fs.existsSync(file.filepath)) {
      return res.status(404).json({ error: "File not found on disk" });
    }

    incrementDownloadCount(hash);
    res.setHeader("Content-Type", file.mimetype || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${file.filename}"`
    );
    res.sendFile(path.resolve(file.filepath));
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ error: "Failed to download file" });
  }
});

app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`🚀 Zapfile backend running on http://localhost:${PORT}`);
});
