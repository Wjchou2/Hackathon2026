import { FormEvent, useEffect, useState } from "react";
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

function App() {
  const [role, setRole] = useState<UserRole>("teacher");
  const [teacherAssignments, setTeacherAssignments] = useState<AssignmentSummary[]>([]);
  const [studentAssignments, setStudentAssignments] = useState<AssignmentSummary[]>([]);
  const [selectedStudentAssignmentId, setSelectedStudentAssignmentId] = useState<number | null>(null);
  const [selectedStudentAssignment, setSelectedStudentAssignment] = useState<AssignmentDetail | null>(null);
  const [draft, setDraft] = useState(defaultAssignment);
  const [generated, setGenerated] = useState<GeneratedAssignment | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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

  return (
    <div className="app-shell">
      <div className="ambient ambient-left" />
      <div className="ambient ambient-right" />

      <header className="hero-panel">
        <div>
          <p className="eyebrow">Religion Class MVP</p>
          <h1>Lesson Remix Studio</h1>
          <p className="hero-copy">
            Turn flat reading assignments into student-ready project options without losing the
            original learning goal.
          </p>
        </div>

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
                <span className="chip">Paste text first. File upload can come later.</span>
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

                <button className="primary-button" disabled={isGenerating} type="submit">
                  {isGenerating ? "Generating remixes..." : "Generate remix options"}
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
                            <p className="remix-tier">
                              {remix.tier} tier · {remix.effort} effort
                            </p>
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
                              <p className="remix-tier">
                                {remix.tier} tier · {remix.effort} effort
                              </p>
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
