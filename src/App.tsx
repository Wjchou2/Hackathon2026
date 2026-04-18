import { CSSProperties, ChangeEvent, FormEvent, useEffect, useState } from "react";
import {
  AssignmentDetail,
  AssignmentSummary,
  GeneratedAssignment,
  SavedRemix,
  UserRole
} from "./types";

const defaultAssignment = {
  title: "",
  sourceText: "",
  teacherNotes: ""
};

const themePresets = {
  dawn: {
    label: "Peach",
    vars: {
      "--page-text": "#3f312c",
      "--page-bg":
        "radial-gradient(circle at top left, rgba(255, 208, 188, 0.85), transparent 28%), radial-gradient(circle at right 15%, rgba(255, 232, 182, 0.78), transparent 30%), linear-gradient(180deg, #fff8f3 0%, #ffe9e2 50%, #fff0dd 100%)",
      "--panel": "rgba(255, 252, 248, 0.86)",
      "--panel-strong": "rgba(255, 248, 243, 0.96)",
      "--border": "rgba(118, 86, 67, 0.14)",
      "--muted": "#83685c",
      "--accent": "#f5b8a8",
      "--accent-strong": "#f2d49b",
      "--accent-text": "#3f2f2a",
      "--success": "#95c7a4",
      "--ambient-left": "rgba(248, 196, 185, 0.45)",
      "--ambient-right": "rgba(245, 220, 173, 0.42)",
      "--surface-soft": "rgba(255, 255, 255, 0.58)",
      "--surface-strong": "rgba(255, 243, 232, 0.9)",
      "--field-bg": "rgba(255, 255, 255, 0.62)",
      "--field-border": "rgba(121, 88, 66, 0.12)",
      "--pill-text": "#6d5245",
      "--prompt-bg": "rgba(245, 220, 204, 0.55)",
      "--image-bg": "linear-gradient(145deg, rgba(245, 184, 168, 0.35), rgba(242, 212, 155, 0.42))",
      "--error-bg": "rgba(240, 176, 166, 0.52)",
      "--error-border": "rgba(185, 98, 83, 0.32)",
      "--error-text": "#6a342c"
    }
  },
  mint: {
    label: "Mint",
    vars: {
      "--page-text": "#273833",
      "--page-bg":
        "radial-gradient(circle at top left, rgba(202, 238, 221, 0.85), transparent 28%), radial-gradient(circle at right 15%, rgba(228, 244, 214, 0.82), transparent 30%), linear-gradient(180deg, #f8fffb 0%, #e4f8ee 52%, #f2fbeb 100%)",
      "--panel": "rgba(251, 255, 252, 0.88)",
      "--panel-strong": "rgba(246, 255, 250, 0.96)",
      "--border": "rgba(64, 102, 88, 0.14)",
      "--muted": "#5f7c73",
      "--accent": "#b6e3cf",
      "--accent-strong": "#d7efb3",
      "--accent-text": "#25342f",
      "--success": "#7eb889",
      "--ambient-left": "rgba(173, 223, 200, 0.48)",
      "--ambient-right": "rgba(212, 240, 181, 0.45)",
      "--surface-soft": "rgba(255, 255, 255, 0.62)",
      "--surface-strong": "rgba(237, 250, 243, 0.92)",
      "--field-bg": "rgba(255, 255, 255, 0.68)",
      "--field-border": "rgba(64, 102, 88, 0.12)",
      "--pill-text": "#4d6e63",
      "--prompt-bg": "rgba(213, 240, 225, 0.62)",
      "--image-bg": "linear-gradient(145deg, rgba(182, 227, 207, 0.42), rgba(215, 239, 179, 0.5))",
      "--error-bg": "rgba(255, 218, 209, 0.68)",
      "--error-border": "rgba(196, 134, 120, 0.34)",
      "--error-text": "#70463d"
    }
  },
  lavender: {
    label: "Lavender",
    vars: {
      "--page-text": "#342d45",
      "--page-bg":
        "radial-gradient(circle at top left, rgba(225, 215, 249, 0.88), transparent 28%), radial-gradient(circle at right 15%, rgba(249, 228, 235, 0.8), transparent 30%), linear-gradient(180deg, #fcf8ff 0%, #efe7fb 52%, #fdeff4 100%)",
      "--panel": "rgba(255, 250, 255, 0.88)",
      "--panel-strong": "rgba(251, 246, 255, 0.97)",
      "--border": "rgba(97, 82, 125, 0.14)",
      "--muted": "#72668f",
      "--accent": "#d7c4f6",
      "--accent-strong": "#f0cfe1",
      "--accent-text": "#322944",
      "--success": "#a4c9b6",
      "--ambient-left": "rgba(207, 190, 245, 0.48)",
      "--ambient-right": "rgba(243, 204, 220, 0.46)",
      "--surface-soft": "rgba(255, 255, 255, 0.62)",
      "--surface-strong": "rgba(245, 239, 252, 0.94)",
      "--field-bg": "rgba(255, 255, 255, 0.66)",
      "--field-border": "rgba(97, 82, 125, 0.12)",
      "--pill-text": "#675b86",
      "--prompt-bg": "rgba(233, 221, 247, 0.6)",
      "--image-bg": "linear-gradient(145deg, rgba(215, 196, 246, 0.42), rgba(240, 207, 225, 0.48))",
      "--error-bg": "rgba(255, 223, 226, 0.72)",
      "--error-border": "rgba(187, 132, 145, 0.34)",
      "--error-text": "#6b3f4a"
    }
  },
  sky: {
    label: "Sky",
    vars: {
      "--page-text": "#25415a",
      "--page-bg":
        "radial-gradient(circle at top left, rgba(197, 228, 255, 0.9), transparent 28%), radial-gradient(circle at right 15%, rgba(233, 243, 202, 0.78), transparent 30%), linear-gradient(180deg, #f7fcff 0%, #e6f4ff 52%, #eef7df 100%)",
      "--panel": "rgba(250, 254, 255, 0.88)",
      "--panel-strong": "rgba(243, 250, 255, 0.97)",
      "--border": "rgba(69, 106, 141, 0.14)",
      "--muted": "#5b7b95",
      "--accent": "#b8dbf9",
      "--accent-strong": "#dbeaa9",
      "--accent-text": "#22374b",
      "--success": "#8dc8b0",
      "--ambient-left": "rgba(183, 215, 247, 0.5)",
      "--ambient-right": "rgba(221, 236, 173, 0.44)",
      "--surface-soft": "rgba(255, 255, 255, 0.64)",
      "--surface-strong": "rgba(238, 248, 255, 0.94)",
      "--field-bg": "rgba(255, 255, 255, 0.68)",
      "--field-border": "rgba(69, 106, 141, 0.12)",
      "--pill-text": "#4f718b",
      "--prompt-bg": "rgba(214, 235, 250, 0.62)",
      "--image-bg": "linear-gradient(145deg, rgba(184, 219, 249, 0.42), rgba(219, 234, 169, 0.48))",
      "--error-bg": "rgba(255, 225, 217, 0.74)",
      "--error-border": "rgba(195, 146, 127, 0.34)",
      "--error-text": "#714638"
    }
  },
  midnight: {
    label: "Midnight",
    vars: {
      "--page-text": "#f2ecff",
      "--page-bg":
        "radial-gradient(circle at top left, rgba(94, 80, 156, 0.34), transparent 28%), radial-gradient(circle at right 15%, rgba(65, 127, 181, 0.28), transparent 30%), linear-gradient(180deg, #161326 0%, #0d1020 52%, #08111b 100%)",
      "--panel": "rgba(22, 20, 39, 0.86)",
      "--panel-strong": "rgba(28, 26, 48, 0.95)",
      "--border": "rgba(199, 190, 255, 0.14)",
      "--muted": "#b8addf",
      "--accent": "#8f83f7",
      "--accent-strong": "#63b5ea",
      "--accent-text": "#f7f5ff",
      "--success": "#77c7a5",
      "--ambient-left": "rgba(126, 106, 210, 0.28)",
      "--ambient-right": "rgba(76, 149, 218, 0.24)",
      "--surface-soft": "rgba(255, 255, 255, 0.06)",
      "--surface-strong": "rgba(33, 30, 57, 0.92)",
      "--field-bg": "rgba(255, 255, 255, 0.05)",
      "--field-border": "rgba(199, 190, 255, 0.1)",
      "--pill-text": "#dfd7ff",
      "--prompt-bg": "rgba(255, 255, 255, 0.06)",
      "--image-bg": "linear-gradient(145deg, rgba(143, 131, 247, 0.2), rgba(99, 181, 234, 0.2))",
      "--error-bg": "rgba(142, 62, 86, 0.34)",
      "--error-border": "rgba(255, 170, 190, 0.24)",
      "--error-text": "#ffd8e2"
    }
  }
} as const;

type ThemeName = keyof typeof themePresets;

const defaultTheme: ThemeName = "dawn";

function App() {
  const [themeName, setThemeName] = useState<ThemeName>(() => {
    if (typeof window === "undefined") {
      return defaultTheme;
    }

    const stored = window.localStorage.getItem("lesson-remix-theme");
    return stored && stored in themePresets ? (stored as ThemeName) : defaultTheme;
  });
  const [role, setRole] = useState<UserRole>("teacher");
  const [teacherAssignments, setTeacherAssignments] = useState<AssignmentSummary[]>([]);
  const [studentAssignments, setStudentAssignments] = useState<AssignmentSummary[]>([]);
  const [selectedStudentAssignmentId, setSelectedStudentAssignmentId] = useState<number | null>(null);
  const [selectedStudentAssignment, setSelectedStudentAssignment] = useState<AssignmentDetail | null>(null);
  const [draft, setDraft] = useState(defaultAssignment);
  const [generated, setGenerated] = useState<GeneratedAssignment | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [uploadedDocumentName, setUploadedDocumentName] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedRemixId, setExpandedRemixId] = useState<number | null>(null);
  const [imageLoadingId, setImageLoadingId] = useState<number | null>(null);

  useEffect(() => {
    void refreshAssignments();
  }, []);

  useEffect(() => {
    if (role === "student" && selectedStudentAssignmentId !== null) {
      void loadStudentAssignment(selectedStudentAssignmentId);
    }
  }, [role, selectedStudentAssignmentId]);

  useEffect(() => {
    window.localStorage.setItem("lesson-remix-theme", themeName);
  }, [themeName]);

  async function refreshAssignments() {
    try {
      setLoadError(null);
      const [teacherRes, studentRes] = await Promise.all([
        fetch("/api/assignments?view=teacher"),
        fetch("/api/assignments?view=student")
      ]);

      if (!teacherRes.ok || !studentRes.ok) {
        throw new Error("Failed to load assignments.");
      }

      const teacherJson = (await teacherRes.json()) as AssignmentSummary[];
      const studentJson = (await studentRes.json()) as AssignmentSummary[];

      setTeacherAssignments(teacherJson);
      setStudentAssignments(studentJson);
      if (studentJson.length > 0 && selectedStudentAssignmentId === null) {
        setSelectedStudentAssignmentId(studentJson[0].id);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load assignments.");
    }
  }

  async function loadStudentAssignment(assignmentId: number) {
    try {
      const res = await fetch(`/api/assignments/${assignmentId}?view=student`);
      if (!res.ok) {
        throw new Error("Failed to load assignment detail.");
      }

      const detail = (await res.json()) as AssignmentDetail;
      setSelectedStudentAssignment(detail);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to load assignment detail.");
    }
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsGenerating(true);
    setLoadError(null);

    try {
      const res = await fetch("/api/assignments/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(draft)
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Failed to generate remix options.");
      }

      const payload = (await res.json()) as GeneratedAssignment;
      setGenerated(payload);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to generate remix options.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleDocumentUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setIsUploadingDocument(true);
    setLoadError(null);

    try {
      const formData = new FormData();
      formData.append("document", file);

      const res = await fetch("/api/assignments/source-document", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Failed to upload document.");
      }

      const payload = (await res.json()) as {
        fileName: string;
        sourceText: string;
        suggestedTitle: string;
      };

      setDraft((current) => ({
        ...current,
        title: current.title.trim() ? current.title : payload.suggestedTitle,
        sourceText: payload.sourceText
      }));
      setUploadedDocumentName(payload.fileName);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to upload document.");
    } finally {
      event.target.value = "";
      setIsUploadingDocument(false);
    }
  }

  async function handleSave() {
    if (!generated) {
      return;
    }

    setIsSaving(true);
    setLoadError(null);

    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(generated)
      });

      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Failed to save assignment.");
      }

      const saved = (await res.json()) as AssignmentDetail;
      setGenerated(null);
      setDraft(defaultAssignment);
      setUploadedDocumentName(null);
      setRole("student");
      setSelectedStudentAssignmentId(saved.id);
      await refreshAssignments();
      await loadStudentAssignment(saved.id);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to save assignment.");
    } finally {
      setIsSaving(false);
    }
  }

  function toggleGeneratedApproval(index: number) {
    setGenerated((current) => {
      if (!current) {
        return current;
      }

      const remixes = current.remixes.map((remix, remixIndex) =>
        remixIndex === index ? { ...remix, approved: !remix.approved } : remix
      );

      return { ...current, remixes };
    });
  }

  async function ensureImage(remix: SavedRemix) {
    if (remix.imageDataUrl) {
      return;
    }

    setImageLoadingId(remix.id);

    try {
      const res = await fetch(`/api/remixes/${remix.id}/image`, {
        method: "POST"
      });

      if (!res.ok) {
        throw new Error("Failed to create image.");
      }

      const json = (await res.json()) as { imageDataUrl: string };
      setSelectedStudentAssignment((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          remixes: current.remixes.map((entry) =>
            entry.id === remix.id ? { ...entry, imageDataUrl: json.imageDataUrl } : entry
          )
        };
      });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to create image.");
    } finally {
      setImageLoadingId(null);
    }
  }

  async function handleExpandRemix(remix: SavedRemix) {
    const nextId = expandedRemixId === remix.id ? null : remix.id;
    setExpandedRemixId(nextId);

    if (nextId === remix.id) {
      await ensureImage(remix);
    }
  }

  const approvedCount = generated?.remixes.filter((remix) => remix.approved).length ?? 0;
  const themeStyle = themePresets[themeName].vars as CSSProperties;

  return (
    <div className="app-shell" style={themeStyle}>
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <header className="hero-panel">
        <div className="hero-copy-block">
          <p className="eyebrow">Religion Class MVP</p>
          <h1>Lesson Remix Studio</h1>
          <p className="hero-copy">
            Turn flat reading assignments into student-ready project options without losing the
            original learning goal.
          </p>
        </div>

        <div className="hero-controls">
          <div className="role-toggle" aria-label="Choose app mode">
            <button
              className={role === "teacher" ? "role-pill active" : "role-pill"}
              onClick={() => setRole("teacher")}
              type="button"
            >
              Teacher
            </button>
            <button
              className={role === "student" ? "role-pill active" : "role-pill"}
              onClick={() => setRole("student")}
              type="button"
            >
              Student
            </button>
          </div>

          <section className="theme-panel" aria-label="Theme configuration">
            <div>
              <p className="section-kicker">Config Panel</p>
              <h2>Color theme</h2>
            </div>
            <div className="theme-options">
              {(Object.entries(themePresets) as Array<[ThemeName, (typeof themePresets)[ThemeName]]>).map(
                ([key, preset]) => (
                  <button
                    key={key}
                    className={themeName === key ? "theme-swatch active" : "theme-swatch"}
                    onClick={() => setThemeName(key)}
                    type="button"
                  >
                    <span className={`swatch-dot swatch-${key}`} />
                    {preset.label}
                  </button>
                )
              )}
            </div>
          </section>
        </div>
      </header>

      {loadError ? <div className="banner error">{loadError}</div> : null}

      <main className="main-grid">
        {role === "teacher" ? (
          <>
            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="section-kicker">Teacher Flow</p>
                  <h2>Create an assignment</h2>
                </div>
                <span className="chip">
                  {uploadedDocumentName ? `Loaded: ${uploadedDocumentName}` : "Upload or paste"}
                </span>
              </div>

              <form className="stack" onSubmit={handleGenerate}>
                <label className="field">
                  <span>Lesson name</span>
                  <input
                    required
                    value={draft.title}
                    onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Ex: Sermon on the Mount reading response"
                  />
                </label>

                <div className="field">
                  <span>Assignment document</span>
                  <label className="upload-field">
                    <input
                      accept=".txt,.md,.pdf,.docx,text/plain,text/markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={handleDocumentUpload}
                      type="file"
                    />
                    <strong>{isUploadingDocument ? "Reading document..." : "Choose a file"}</strong>
                    <p>
                      Upload a `.txt`, `.md`, `.pdf`, or `.docx` file. The extracted text becomes the
                      assignment and stays editable below.
                    </p>
                  </label>
                </div>

                <label className="field">
                  <span>Assignment or reading text</span>
                  <textarea
                    required
                    value={draft.sourceText}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, sourceText: event.target.value }))
                    }
                    placeholder="Paste the teacher prompt, source excerpt, or chapter summary."
                    rows={10}
                  />
                </label>

                <label className="field">
                  <span>Teacher notes (optional)</span>
                  <textarea
                    value={draft.teacherNotes}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, teacherNotes: event.target.value }))
                    }
                    placeholder="Any classroom constraints, tone rules, or specific objectives."
                    rows={4}
                  />
                </label>

                <button className="primary-button" disabled={isGenerating || isUploadingDocument} type="submit">
                  {isUploadingDocument
                    ? "Reading document..."
                    : isGenerating
                      ? "Generating remixes..."
                      : "Generate remix options"}
                </button>
              </form>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="section-kicker">Review</p>
                  <h2>Approve the options worth offering</h2>
                </div>
                <span className="chip">{approvedCount} selected</span>
              </div>

              {generated ? (
                <div className="stack">
                  <div className="summary-card">
                    <h3>{generated.title}</h3>
                    <p>{generated.summary}</p>
                    <div className="goal-list">
                      {generated.learningGoals.map((goal) => (
                        <span className="goal-pill" key={goal}>
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="stack">
                    {generated.remixes.map((remix, index) => (
                      <article className="remix-review-card" key={`${remix.ideaKey}-${index}`}>
                        <div className="remix-review-head">
                          <div>
                            <p className="remix-meta">{remix.effort} effort</p>
                            <h3>{remix.title}</h3>
                          </div>

                          <label className="checkbox-pill">
                            <input
                              checked={remix.approved}
                              onChange={() => toggleGeneratedApproval(index)}
                              type="checkbox"
                            />
                            <span>{remix.approved ? "Approved" : "Hidden"}</span>
                          </label>
                        </div>

                        <p className="pitch">{remix.pitch}</p>
                        <p className="muted">{remix.rationale}</p>
                        <p className="student-prompt-preview">{remix.studentPrompt}</p>
                        <div className="materials">
                          {remix.materials.map((material) => (
                            <span className="material-pill" key={material}>
                              {material}
                            </span>
                          ))}
                        </div>
                      </article>
                    ))}
                  </div>

                  <button
                    className="primary-button"
                    disabled={approvedCount === 0 || isSaving}
                    onClick={() => void handleSave()}
                    type="button"
                  >
                    {isSaving ? "Saving assignment..." : "Save approved assignment"}
                  </button>
                </div>
              ) : (
                <div className="empty-state">
                  Generate remix ideas from a reading assignment, then approve the ones you want
                  students to see.
                </div>
              )}
            </section>

            <section className="panel full-width">
              <div className="panel-header">
                <div>
                  <p className="section-kicker">Saved Assignments</p>
                  <h2>Teacher library</h2>
                </div>
                <span className="chip">{teacherAssignments.length} total</span>
              </div>

              <div className="assignment-grid">
                {teacherAssignments.length > 0 ? (
                  teacherAssignments.map((assignment) => (
                    <article className="assignment-card" key={assignment.id}>
                      <p className="assignment-meta">{formatDate(assignment.createdAt)}</p>
                      <h3>{assignment.title}</h3>
                      <p>{assignment.summary}</p>
                      <span className="chip subtle">{assignment.approvedCount} student options</span>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">
                    No saved assignments yet. Start with one reading prompt and keep the first flow
                    small.
                  </div>
                )}
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="panel panel-narrow">
              <div className="panel-header">
                <div>
                  <p className="section-kicker">Student Flow</p>
                  <h2>Assignments</h2>
                </div>
                <span className="chip">{studentAssignments.length} live</span>
              </div>

              <div className="stack">
                {studentAssignments.length > 0 ? (
                  studentAssignments.map((assignment) => (
                    <button
                      className={
                        selectedStudentAssignmentId === assignment.id
                          ? "list-card active"
                          : "list-card"
                      }
                      key={assignment.id}
                      onClick={() => setSelectedStudentAssignmentId(assignment.id)}
                      type="button"
                    >
                      <p className="assignment-meta">{formatDate(assignment.createdAt)}</p>
                      <h3>{assignment.title}</h3>
                      <p>{assignment.summary}</p>
                      <span className="chip subtle">{assignment.approvedCount} ways to complete</span>
                    </button>
                  ))
                ) : (
                  <div className="empty-state">Teachers have not published any remixed assignments yet.</div>
                )}
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="section-kicker">Student View</p>
                  <h2>{selectedStudentAssignment?.title ?? "Choose an assignment"}</h2>
                </div>
              </div>

              {selectedStudentAssignment ? (
                <div className="stack">
                  <div className="summary-card">
                    <p>{selectedStudentAssignment.summary}</p>
                    <div className="goal-list">
                      {selectedStudentAssignment.learningGoals.map((goal) => (
                        <span className="goal-pill" key={goal}>
                          {goal}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="student-grid">
                    {selectedStudentAssignment.remixes.map((remix) => {
                      const expanded = expandedRemixId === remix.id;

                      return (
                        <article className={expanded ? "student-card expanded" : "student-card"} key={remix.id}>
                          <div className="student-card-header">
                            <div>
                              <p className="remix-meta">{remix.effort} effort</p>
                              <h3>{remix.title}</h3>
                            </div>

                            <button
                              className="secondary-button"
                              onClick={() => void handleExpandRemix(remix)}
                              type="button"
                            >
                              {expanded ? "Collapse" : "Open"}
                            </button>
                          </div>

                          <p>{remix.pitch}</p>

                          {expanded ? (
                            <div className="expanded-panel">
                              <div className="image-frame">
                                {imageLoadingId === remix.id && !remix.imageDataUrl ? (
                                  <div className="image-placeholder">Generating image...</div>
                                ) : remix.imageDataUrl ? (
                                  <img alt={remix.title} src={remix.imageDataUrl} />
                                ) : (
                                  <div className="image-placeholder">No image yet.</div>
                                )}
                              </div>

                              <div className="stack">
                                <div>
                                  <p className="detail-label">Your prompt</p>
                                  <p className="student-prompt-preview">{remix.studentPrompt}</p>
                                </div>
                                <div>
                                  <p className="detail-label">Why this works</p>
                                  <p className="muted">{remix.rationale}</p>
                                </div>
                                <div className="materials">
                                  {remix.materials.map((material) => (
                                    <span className="material-pill" key={material}>
                                      {material}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="empty-state">Pick an assignment to see the approved project cards.</div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}

export default App;
