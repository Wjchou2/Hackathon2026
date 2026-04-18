export type UserRole = "teacher" | "student";

export type PendingRemix = {
  ideaKey: string;
  title: string;
  pitch: string;
  rationale: string;
  studentPrompt: string;
  imagePrompt: string;
  effort: "low" | "medium" | "high";
  tier: string;
  materials: string[];
  approved: boolean;
};

export type GeneratedAssignment = {
  title: string;
  sourceText: string;
  teacherNotes: string;
  summary: string;
  learningGoals: string[];
  remixes: PendingRemix[];
};

export type SavedRemix = PendingRemix & {
  id: number;
  assignmentId: number;
  imageDataUrl: string | null;
};

export type AssignmentSummary = {
  id: number;
  title: string;
  summary: string;
  createdAt: string;
  approvedCount: number;
};

export type AssignmentDetail = {
  id: number;
  title: string;
  sourceText: string;
  teacherNotes: string;
  summary: string;
  learningGoals: string[];
  createdAt: string;
  remixes: SavedRemix[];
};
