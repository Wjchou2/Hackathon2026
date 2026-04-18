import express from "express";
import cors from "cors";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createAssignment, getAssignmentById, getRemixById, listAssignments, updateRemixImage } from "./db.js";
import { generateAssignmentRemixes, generateRemixImage } from "./ai.js";
import { buildAssignmentTitleFromFileName, parseAssignmentDocument } from "./document.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3001);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/assignments", (req, res) => {
  const view = req.query.view === "student" ? "student" : "teacher";
  res.json(listAssignments(view));
});

app.get("/api/assignments/:id", (req, res) => {
  const id = Number(req.params.id);
  const view = req.query.view === "student" ? "student" : "teacher";
  const assignment = getAssignmentById(id, view);

  if (!assignment) {
    res.status(404).send("Assignment not found.");
    return;
  }

  res.json(assignment);
});

app.post("/api/assignments/source-document", (req, res, next) => {
  upload.single("document")(req, res, (error) => {
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      res.status(400).send("The document is too large. Upload a file smaller than 10 MB.");
      return;
    }

    if (error) {
      next(error);
      return;
    }

    void (async () => {
      try {
        if (!req.file) {
          res.status(400).send("Upload a document file.");
          return;
        }

        const parsed = await parseAssignmentDocument(req.file);
        res.json({
          fileName: parsed.fileName,
          sourceText: parsed.sourceText,
          suggestedTitle: buildAssignmentTitleFromFileName(parsed.fileName)
        });
      } catch (routeError) {
        const message =
          routeError instanceof Error ? routeError.message : "Failed to read the uploaded document.";
        res.status(400).send(message);
      }
    })();
  });
});

app.post("/api/assignments/generate", async (req, res) => {
  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
  const sourceText = typeof req.body.sourceText === "string" ? req.body.sourceText.trim() : "";
  const teacherNotes = typeof req.body.teacherNotes === "string" ? req.body.teacherNotes.trim() : "";

  if (!title || !sourceText) {
    res.status(400).send("Title and assignment text are required.");
    return;
  }

  const generated = await generateAssignmentRemixes({ title, sourceText, teacherNotes });
  res.json(generated);
});

app.post("/api/assignments", (req, res) => {
  const title = typeof req.body.title === "string" ? req.body.title.trim() : "";
  const sourceText = typeof req.body.sourceText === "string" ? req.body.sourceText.trim() : "";

  if (!title || !sourceText || !Array.isArray(req.body.remixes)) {
    res.status(400).send("A generated assignment payload is required.");
    return;
  }

  const saved = createAssignment({
    title,
    sourceText,
    teacherNotes: typeof req.body.teacherNotes === "string" ? req.body.teacherNotes : "",
    summary: typeof req.body.summary === "string" ? req.body.summary : "",
    learningGoals: Array.isArray(req.body.learningGoals)
      ? req.body.learningGoals.filter((goal: unknown): goal is string => typeof goal === "string")
      : [],
    remixes: req.body.remixes
  });

  res.status(201).json(saved);
});

app.post("/api/remixes/:id/image", async (req, res) => {
  const id = Number(req.params.id);
  const remix = getRemixById(id);

  if (!remix) {
    res.status(404).send("Remix not found.");
    return;
  }

  if (remix.imageDataUrl) {
    res.json({ imageDataUrl: remix.imageDataUrl });
    return;
  }

  const imageDataUrl = await generateRemixImage(remix);
  updateRemixImage(id, imageDataUrl);
  res.json({ imageDataUrl });
});

if (process.env.NODE_ENV === "production") {
  const clientDir = path.resolve(__dirname, "../dist");
  app.use(express.static(clientDir));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDir, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Lesson Remix Studio API running on http://localhost:${port}`);
});
