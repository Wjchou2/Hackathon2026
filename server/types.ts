export type IdeaTemplate = {
  key: string;
  label: string;
  tier: string;
  tags: string[];
  effortSignal: boolean;
  largeProject: boolean;
};

export type GeneratedRemix = {
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
  remixes: GeneratedRemix[];
};

export type AssignmentRecord = {
  id: number;
  title: string;
  sourceText: string;
  teacherNotes: string;
  summary: string;
  learningGoals: string[];
  createdAt: string;
};

export type RemixRecord = GeneratedRemix & {
  id: number;
  assignmentId: number;
  imageDataUrl: string | null;
};
