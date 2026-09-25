import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";

// Determine persistent data storage directory: prioritize /app/data, then CONFIG_DIR, then local ./data
function resolveDataDir(): string {
  if (process.env.DATA_DIR && fs.existsSync(process.env.DATA_DIR)) {
    return process.env.DATA_DIR;
  }
  if (fs.existsSync("/app/data")) {
    return "/app/data";
  }
  if (process.env.CONFIG_DIR && fs.existsSync(process.env.CONFIG_DIR)) {
    return process.env.CONFIG_DIR;
  }
  if (fs.existsSync("/config")) {
    return "/config";
  }
  const localData = path.join(process.cwd(), "data");
  if (!fs.existsSync(localData)) {
    fs.mkdirSync(localData, { recursive: true });
  }
  return localData;
}

const DATA_DIR = resolveDataDir();
const TRACKS_DIR = path.join(DATA_DIR, "tracks");
const SOUNDS_DIR = path.join(DATA_DIR, "sounds");
const TRACKS_JSON_FILE = path.join(DATA_DIR, "tracks.json");
const ROSTERS_JSON_FILE = path.join(DATA_DIR, "rosters.json");
const SETTINGS_JSON_FILE = path.join(DATA_DIR, "settings.json");
const MEMORIES_FILE = path.join(DATA_DIR, "track_memories.json");

// Ensure directories exist
[DATA_DIR, TRACKS_DIR, SOUNDS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch (e) {
      console.error(`Failed to create directory ${dir}:`, e);
    }
  }
});

// Configure Multer for Track Uploads directly into /app/data/tracks/
const trackStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, TRACKS_DIR);
  },
  filename: (_req, file, cb) => {
    const rawName = Buffer.from(file.originalname, "latin1").toString("utf8");
    const ext = path.extname(rawName) || ".mp3";
    const base = path.basename(rawName, ext).replace(/[^a-zA-Z0-9_\-\s.]/g, "").trim() || "song";
    const unique = Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    cb(null, `${base}_${unique}${ext}`);
  },
});
const uploadTrack = multer({
  storage: trackStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max per audio file
});

// Configure Multer for Goal Horn Sound into /app/data/sounds/
const hornStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, SOUNDS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".mp3";
    cb(null, `goal_horn${ext}`);
  },
});
const uploadHorn = multer({
  storage: hornStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

// JSON File helper utilities
function readJsonFile<T>(filePath: string, fallback: T): T {
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error(`Failed to write JSON file ${filePath}:`, err);
  }
}

// Audio Streamer with HTTP Range support for seamless iPad scrubbing and playback
function streamAudioFile(filePath: string, req: express.Request, res: express.Response) {
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found" });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const ext = path.extname(filePath).toLowerCase();

  const mimeMap: Record<string, string> = {
    ".mp3": "audio/mpeg",
    ".wav": "audio/wav",
    ".ogg": "audio/ogg",
    ".flac": "audio/flac",
    ".m4a": "audio/mp4",
    ".aac": "audio/aac",
  };
  const contentType = mimeMap[ext] || "audio/mpeg";

  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": contentType,
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
}

// Scan the /app/data/tracks folder and synchronize with tracks.json
function getStoredTracks(): any[] {
  const metaTracks = readJsonFile<any[]>(TRACKS_JSON_FILE, []);
  const metaMap = new Map<string, any>(metaTracks.map((t) => [t.filename || t.id, t]));

  if (!fs.existsSync(TRACKS_DIR)) return metaTracks;

  const files = fs.readdirSync(TRACKS_DIR);
  const audioExtensions = new Set([".mp3", ".wav", ".flac", ".ogg", ".m4a", ".aac"]);
  const activeTracks: any[] = [];

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (!audioExtensions.has(ext)) continue;

    const existing = metaMap.get(file);
    if (existing) {
      activeTracks.push({
        ...existing,
        url: `/api/tracks/audio/${encodeURIComponent(file)}`,
      });
    } else {
      // Auto-indexed from directory
      const cleanTitle = path.basename(file, ext).replace(/_[a-z0-9]+$/i, "");
      const newTrack = {
        id: file,
        filename: file,
        title: cleanTitle,
        artist: "Arena Audio",
        album: "Local Storage",
        duration: 180,
        isLocalFile: true,
        format: ext.replace(".", "").toUpperCase(),
        url: `/api/tracks/audio/${encodeURIComponent(file)}`,
        addedAt: Date.now(),
      };
      activeTracks.push(newTrack);
    }
  }

  // Update tracks.json if changed
  writeJsonFile(TRACKS_JSON_FILE, activeTracks);
  return activeTracks;
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // CORS for dev convenience
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Range, Authorization");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Health endpoint
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      dataDir: DATA_DIR,
    });
  });

  // System info
  app.get("/api/unraid/info", (_req, res) => {
    res.json({
      dataDir: DATA_DIR,
      tracksDir: TRACKS_DIR,
      soundsDir: SOUNDS_DIR,
      isDocker: fs.existsSync("/.dockerenv"),
      uptime: Math.floor(process.uptime()),
    });
  });

  // -------------------------------------------------------------
  // Tracks & Songs API stored in /app/data/tracks/
  // -------------------------------------------------------------
  app.get("/api/tracks", (_req, res) => {
    const tracks = getStoredTracks();
    res.json(tracks);
  });

  app.post("/api/tracks/upload", uploadTrack.array("files", 50), (req, res) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const currentTracks = readJsonFile<any[]>(TRACKS_JSON_FILE, []);
    const addedTracks: any[] = [];

    for (const file of files) {
      const rawName = Buffer.from(file.originalname, "latin1").toString("utf8");
      const ext = path.extname(rawName).toLowerCase();
      const title = path.basename(rawName, path.extname(rawName));

      const newTrack = {
        id: file.filename,
        filename: file.filename,
        title,
        artist: "Arena Import",
        album: "RinkDeck Library",
        duration: 180,
        isLocalFile: true,
        format: ext.replace(".", "").toUpperCase() || "AUDIO",
        url: `/api/tracks/audio/${encodeURIComponent(file.filename)}`,
        addedAt: Date.now(),
      };

      currentTracks.unshift(newTrack);
      addedTracks.push(newTrack);
    }

    writeJsonFile(TRACKS_JSON_FILE, currentTracks);
    res.json({ success: true, tracks: addedTracks });
  });

  app.get("/api/tracks/audio/:filename", (req, res) => {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(TRACKS_DIR, filename);
    streamAudioFile(filePath, req, res);
  });

  app.delete("/api/tracks/:filename", (req, res) => {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(TRACKS_DIR, filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Failed to delete file:", err);
      }
    }
    const currentTracks = readJsonFile<any[]>(TRACKS_JSON_FILE, []);
    const updated = currentTracks.filter((t) => t.filename !== filename && t.id !== filename);
    writeJsonFile(TRACKS_JSON_FILE, updated);
    res.json({ success: true });
  });

  // -------------------------------------------------------------
  // Goal Horn Sound API stored in /app/data/sounds/
  // -------------------------------------------------------------
  app.get("/api/horn/info", (_req, res) => {
    if (!fs.existsSync(SOUNDS_DIR)) {
      return res.json({ custom: false, fileName: null });
    }
    const files = fs.readdirSync(SOUNDS_DIR).filter((f) => f.startsWith("goal_horn"));
    if (files.length > 0) {
      return res.json({
        custom: true,
        fileName: files[0],
        url: `/api/horn/audio`,
      });
    }
    res.json({ custom: false, fileName: null });
  });

  app.post("/api/horn/upload", uploadHorn.single("horn"), (req, res) => {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: "No horn file uploaded" });
    }
    res.json({
      success: true,
      fileName: file.filename,
      url: `/api/horn/audio`,
    });
  });

  app.get("/api/horn/audio", (req, res) => {
    if (!fs.existsSync(SOUNDS_DIR)) {
      return res.status(404).json({ error: "No custom horn file found" });
    }
    const files = fs.readdirSync(SOUNDS_DIR).filter((f) => f.startsWith("goal_horn"));
    if (files.length === 0) {
      return res.status(404).json({ error: "No custom horn file found" });
    }
    const filePath = path.join(SOUNDS_DIR, files[0]);
    streamAudioFile(filePath, req, res);
  });

  app.delete("/api/horn", (_req, res) => {
    if (fs.existsSync(SOUNDS_DIR)) {
      const files = fs.readdirSync(SOUNDS_DIR).filter((f) => f.startsWith("goal_horn"));
      for (const file of files) {
        try {
          fs.unlinkSync(path.join(SOUNDS_DIR, file));
        } catch {}
      }
    }
    res.json({ success: true });
  });

  // -------------------------------------------------------------
  // Rosters API stored in /app/data/rosters.json
  // -------------------------------------------------------------
  app.get("/api/rosters", (_req, res) => {
    const rosters = readJsonFile<any[] | null>(ROSTERS_JSON_FILE, null);
    res.json(rosters);
  });

  app.post("/api/rosters", (req, res) => {
    const rosters = req.body;
    if (Array.isArray(rosters)) {
      writeJsonFile(ROSTERS_JSON_FILE, rosters);
      res.json({ success: true, count: rosters.length });
    } else {
      res.status(400).json({ error: "Invalid rosters payload, expected array" });
    }
  });

  // -------------------------------------------------------------
  // Settings API stored in /app/data/settings.json
  // -------------------------------------------------------------
  app.get("/api/settings", (_req, res) => {
    const settings = readJsonFile<any>(SETTINGS_JSON_FILE, {});
    res.json(settings);
  });

  app.post("/api/settings", (req, res) => {
    const current = readJsonFile<any>(SETTINGS_JSON_FILE, {});
    const updated = { ...current, ...req.body };
    writeJsonFile(SETTINGS_JSON_FILE, updated);
    res.json({ success: true, settings: updated });
  });

  // -------------------------------------------------------------
  // Track Cue Memories API stored in /app/data/track_memories.json
  // -------------------------------------------------------------
  app.get("/api/memories", (_req, res) => {
    const memories = readJsonFile<any>(MEMORIES_FILE, {});
    res.json(memories);
  });

  app.post("/api/memories", (req, res) => {
    const updatedMemories = req.body;
    if (typeof updatedMemories === "object" && updatedMemories !== null) {
      writeJsonFile(MEMORIES_FILE, updatedMemories);
      res.json({ success: true, count: Object.keys(updatedMemories).length });
    } else {
      res.status(400).json({ error: "Invalid memories payload" });
    }
  });

  // Vite middleware in dev; static file serving in production
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[RinkDeck Audio Player] Server listening on http://0.0.0.0:${PORT}`);
    console.log(`[Storage] Persistent Data Directory: ${DATA_DIR}`);
    console.log(`[Storage] Tracks Directory: ${TRACKS_DIR}`);
    console.log(`[Storage] Sounds Directory: ${SOUNDS_DIR}`);
  });
}

startServer();
