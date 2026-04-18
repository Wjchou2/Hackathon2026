import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { fileURLToPath } from "node:url";
import { AssignmentRecord, GeneratedAssignment, RemixRecord } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, "../data");

fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "lesson-remix.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    source_text TEXT NOT NULL,
    teacher_notes TEXT NOT NULL DEFAULT '',
    summary TEXT NOT NULL,
    learning_goals TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS remixes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL,
    idea_key TEXT NOT NULL,
    title TEXT NOT NULL,
    pitch TEXT NOT NULL,
    rationale TEXT NOT NULL,
    student_prompt TEXT NOT NULL,
    image_prompt TEXT NOT NULL,
    effort TEXT NOT NULL,
    tier TEXT NOT NULL,
    materials TEXT NOT NULL,
    approved INTEGER NOT NULL DEFAULT 0,
    image_data_url TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (assignment_id) REFERENCES assignments (id) ON DELETE CASCADE
  );
`);

type AssignmentRow = {
  id: number;
  title: string;
  source_text: string;
  teacher_notes: string;
  summary: string;
  learning_goals: string;
  created_at: string;
};

type RemixRow = {
  id: number;
  assignment_id: number;
  idea_key: string;
  title: string;
  pitch: string;
  rationale: string;
  student_prompt: string;
  image_prompt: string;
  effort: "low" | "medium" | "high";
  tier: string;
  materials: string;
  approved: number;
  image_data_url: string | null;
};

export function listAssignments(view: "teacher" | "student") {
  const havingClause = view === "student" ? "HAVING approved_count > 0" : "";
  const rows = db
    .prepare(
      `
      SELECT
        a.id,
        a.title,
        a.summary,
        a.created_at,
        COALESCE(SUM(CASE WHEN r.approved = 1 THEN 1 ELSE 0 END), 0) AS approved_count
      FROM assignments a
      LEFT JOIN remixes r ON r.assignment_id = a.id
      GROUP BY a.id
      ${havingClause}
      ORDER BY a.created_at DESC
      `
    )
    .all() as Array<{
      id: number;
      title: string;
      summary: string;
      created_at: string;
      approved_count: number;
    }>;

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    summary: row.summary,
    createdAt: row.created_at,
    approvedCount: row.approved_count ?? 0
  }));
}

export function createAssignment(input: GeneratedAssignment) {
  const insertAssignment = db.prepare(`
    INSERT INTO assignments (title, source_text, teacher_notes, summary, learning_goals)
    VALUES (@title, @sourceText, @teacherNotes, @summary, @learningGoals)
  `);

  const insertRemix = db.prepare(`
    INSERT INTO remixes (
      assignment_id,
      idea_key,
      title,
      pitch,
      rationale,
      student_prompt,
      image_prompt,
      effort,
      tier,
      materials,
      approved,
      sort_order
    )
    VALUES (
      @assignmentId,
      @ideaKey,
      @title,
      @pitch,
      @rationale,
      @studentPrompt,
      @imagePrompt,
      @effort,
      @tier,
      @materials,
      @approved,
      @sortOrder
    )
  `);

  const transaction = db.transaction(() => {
    const assignmentResult = insertAssignment.run({
      title: input.title,
      sourceText: input.sourceText,
      teacherNotes: input.teacherNotes,
      summary: input.summary,
      learningGoals: JSON.stringify(input.learningGoals)
    });

    const assignmentId = Number(assignmentResult.lastInsertRowid);

    input.remixes.forEach((remix, index) => {
      insertRemix.run({
        assignmentId,
        ideaKey: remix.ideaKey,
        title: remix.title,
        pitch: remix.pitch,
        rationale: remix.rationale,
        studentPrompt: remix.studentPrompt,
        imagePrompt: remix.imagePrompt,
        effort: remix.effort,
        tier: remix.tier,
        materials: JSON.stringify(remix.materials),
        approved: remix.approved ? 1 : 0,
        sortOrder: index
      });
    });

    return assignmentId;
  });

  const assignmentId = transaction();
  return getAssignmentById(assignmentId, "teacher");
}

export function getAssignmentById(id: number, view: "teacher" | "student") {
  const assignment = db
    .prepare(
      `
      SELECT id, title, source_text, teacher_notes, summary, learning_goals, created_at
      FROM assignments
      WHERE id = ?
      `
    )
    .get(id) as AssignmentRow | undefined;

  if (!assignment) {
    return null;
  }

  const remixes = db
    .prepare(
      `
      SELECT *
      FROM remixes
      WHERE assignment_id = ?
      ${view === "student" ? "AND approved = 1" : ""}
      ORDER BY sort_order ASC
      `
    )
    .all(id) as RemixRow[];

  return mapAssignment(assignment, remixes);
}

export function getRemixById(id: number) {
  const remix = db.prepare("SELECT * FROM remixes WHERE id = ?").get(id) as RemixRow | undefined;
  return remix ? mapRemix(remix) : null;
}

export function updateRemixImage(id: number, imageDataUrl: string) {
  db.prepare("UPDATE remixes SET image_data_url = ? WHERE id = ?").run(imageDataUrl, id);
  return getRemixById(id);
}

function mapAssignment(assignment: AssignmentRow, remixes: RemixRow[]): AssignmentRecord & { remixes: RemixRecord[] } {
  return {
    id: assignment.id,
    title: assignment.title,
    sourceText: assignment.source_text,
    teacherNotes: assignment.teacher_notes,
    summary: assignment.summary,
    learningGoals: parseArray(assignment.learning_goals),
    createdAt: assignment.created_at,
    remixes: remixes.map(mapRemix)
  };
}

function mapRemix(remix: RemixRow): RemixRecord {
  return {
    id: remix.id,
    assignmentId: remix.assignment_id,
    ideaKey: remix.idea_key,
    title: remix.title,
    pitch: remix.pitch,
    rationale: remix.rationale,
    studentPrompt: remix.student_prompt,
    imagePrompt: remix.image_prompt,
    effort: remix.effort,
    tier: remix.tier,
    materials: parseArray(remix.materials),
    approved: remix.approved === 1,
    imageDataUrl: remix.image_data_url
  };
}

function parseArray(value: string) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
