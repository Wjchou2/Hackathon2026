import OpenAI from "openai";
import { loadIdeaCatalog } from "./ideas.js";
import { GeneratedAssignment, GeneratedRemix, IdeaTemplate } from "./types.js";

const model = "gpt-5.4-mini";
const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function generateAssignmentRemixes(input: {
  title: string;
  sourceText: string;
  teacherNotes?: string;
}): Promise<GeneratedAssignment> {
  const ideas = loadIdeaCatalog();
  const teacherNotes = input.teacherNotes?.trim() ?? "";

  if (!client) {
    return buildFallbackAssignment({
      title: input.title,
      sourceText: input.sourceText,
      teacherNotes,
      ideas
    });
  }

  try {
    const response = await client.responses.create({
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text:
                "You help religion teachers remix reading assignments into engaging project options. Return strict JSON only. Keep options faithful to the source material, age-appropriate, and practical for a classroom."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                `Lesson title: ${input.title}`,
                "",
                "Source assignment:",
                input.sourceText,
                "",
                teacherNotes ? `Teacher notes:\n${teacherNotes}\n` : "",
                "Idea catalog:",
                ideas
                  .map(
                    (idea) =>
                      `- ${idea.label} | key=${idea.key} | tier=${idea.tier} | effortSignal=${idea.effortSignal} | largeProject=${idea.largeProject}`
                  )
                  .join("\n"),
                "",
                "Return JSON with this exact shape:",
                `{
  "title": "string",
  "sourceText": "string",
  "teacherNotes": "string",
  "summary": "2-3 sentence summary",
  "learningGoals": ["goal 1", "goal 2", "goal 3"],
  "remixes": [
    {
      "ideaKey": "must match a catalog key",
      "title": "short student-facing title",
      "pitch": "1-2 sentence hook",
      "rationale": "why this option still teaches the lesson",
      "studentPrompt": "clear student instructions in one paragraph",
      "imagePrompt": "illustration prompt with no text overlay",
      "effort": "low|medium|high",
      "tier": "catalog tier letter",
      "materials": ["material 1", "material 2"],
      "approved": true
    }
  ]
}`,
                "",
                "Requirements:",
                "- Return 6 remix options.",
                "- Prefer ideas from S, A, or B tiers when they fit.",
                "- Avoid options that require unusual supplies unless the source strongly suggests it.",
                "- Make every studentPrompt specific, concrete, and classroom-ready.",
                "- Do not include markdown code fences."
              ].join("\n")
            }
          ]
        }
      ]
    });

    const parsed = parseModelJson(response.output_text);
    return normalizeGeneratedAssignment(parsed, input.title, input.sourceText, teacherNotes, ideas);
  } catch {
    return buildFallbackAssignment({
      title: input.title,
      sourceText: input.sourceText,
      teacherNotes,
      ideas
    });
  }
}

export async function generateRemixImage(remix: GeneratedRemix) {
  if (!client) {
    return makeFallbackImage(remix.title, remix.imagePrompt, remix.tier);
  }

  try {
    const image = await client.images.generate({
      model: "gpt-image-1",
      prompt: `${remix.imagePrompt}. Warm classroom illustration, rich texture, no words or captions.`,
      size: "1024x1024"
    });

    const encoded = image.data?.[0]?.b64_json;
    if (encoded) {
      return `data:image/png;base64,${encoded}`;
    }
  } catch {
    return makeFallbackImage(remix.title, remix.imagePrompt, remix.tier);
  }

  return makeFallbackImage(remix.title, remix.imagePrompt, remix.tier);
}

function normalizeGeneratedAssignment(
  raw: unknown,
  title: string,
  sourceText: string,
  teacherNotes: string,
  ideas: IdeaTemplate[]
): GeneratedAssignment {
  const safeObject = typeof raw === "object" && raw !== null ? raw : {};
  const rawAssignment = safeObject as Partial<GeneratedAssignment>;
  const catalogByKey = new Map(ideas.map((idea) => [idea.key, idea]));
  const fallback = buildFallbackAssignment({ title, sourceText, teacherNotes, ideas });

  const remixes = Array.isArray(rawAssignment.remixes)
    ? rawAssignment.remixes
        .map((entry) => normalizeRemix(entry, catalogByKey))
        .filter((entry): entry is GeneratedRemix => entry !== null)
        .slice(0, 6)
    : [];

  return {
    title: typeof rawAssignment.title === "string" && rawAssignment.title.trim() ? rawAssignment.title : title,
    sourceText,
    teacherNotes,
    summary:
      typeof rawAssignment.summary === "string" && rawAssignment.summary.trim()
        ? rawAssignment.summary
        : fallback.summary,
    learningGoals:
      Array.isArray(rawAssignment.learningGoals) && rawAssignment.learningGoals.length > 0
        ? rawAssignment.learningGoals.filter((goal): goal is string => typeof goal === "string").slice(0, 4)
        : fallback.learningGoals,
    remixes: remixes.length > 0 ? remixes : fallback.remixes
  };
}

function normalizeRemix(
  value: unknown,
  catalogByKey: Map<string, IdeaTemplate>
): GeneratedRemix | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const remix = value as Partial<GeneratedRemix>;
  const idea = remix.ideaKey ? catalogByKey.get(remix.ideaKey) : undefined;
  if (!idea) {
    return null;
  }

  const effort =
    remix.effort === "low" || remix.effort === "medium" || remix.effort === "high"
      ? remix.effort
      : idea.largeProject
        ? "high"
        : idea.effortSignal
          ? "medium"
          : "low";

  const materials = Array.isArray(remix.materials)
    ? remix.materials.filter((item): item is string => typeof item === "string").slice(0, 5)
    : ["Notebook", "Lesson text"];

  if (!remix.title || !remix.pitch || !remix.rationale || !remix.studentPrompt || !remix.imagePrompt) {
    return null;
  }

  return {
    ideaKey: idea.key,
    title: remix.title,
    pitch: remix.pitch,
    rationale: remix.rationale,
    studentPrompt: remix.studentPrompt,
    imagePrompt: remix.imagePrompt,
    effort,
    tier: idea.tier,
    materials,
    approved: typeof remix.approved === "boolean" ? remix.approved : true
  };
}

function buildFallbackAssignment(input: {
  title: string;
  sourceText: string;
  teacherNotes: string;
  ideas: IdeaTemplate[];
}): GeneratedAssignment {
  const sourceSnippet = summarizeSource(input.sourceText);
  const learningGoals = extractLearningGoals(input.sourceText);
  const selectedIdeas = input.ideas.filter((idea) => ["S", "A", "B"].includes(idea.tier)).slice(0, 6);

  return {
    title: input.title,
    sourceText: input.sourceText,
    teacherNotes: input.teacherNotes,
    summary: `Students will engage with ${input.title} by showing what the reading means, not just restating it. The options stay tied to the text while offering different ways to explain, visualize, or perform the core ideas.`,
    learningGoals,
    remixes: selectedIdeas.map((idea, index) => buildFallbackRemix(idea, input.title, sourceSnippet, index))
  };
}

function buildFallbackRemix(
  idea: IdeaTemplate,
  lessonTitle: string,
  sourceSnippet: string,
  index: number
): GeneratedRemix {
  const effort: GeneratedRemix["effort"] = idea.largeProject ? "high" : idea.effortSignal ? "medium" : "low";

  return {
    ideaKey: idea.key,
    title: `${idea.label}: ${lessonTitle}`,
    pitch: `Use a ${idea.label.toLowerCase()} format to show what the reading means instead of turning in a routine written response.`,
    rationale: `This remix keeps students anchored to the text by requiring them to translate ${sourceSnippet} into a clear product with evidence and interpretation.`,
    studentPrompt: `Create a ${idea.label.toLowerCase()} that explains the key message of "${lessonTitle}". Use at least two details from the reading, make the meaning clear to someone who has not read it, and show how the lesson connects to faith, character, or daily life. Finish with a short explanation of why you made your choices.`,
    imagePrompt: `A vivid classroom-style illustration of students presenting a ${idea.label.toLowerCase()} inspired by ${lessonTitle}, warm lighting, expressive faces, meaningful religious symbolism, detailed environment`,
    effort,
    tier: idea.tier,
    materials: inferMaterials(idea.label, effort, index),
    approved: index < 4
  };
}

function inferMaterials(label: string, effort: GeneratedRemix["effort"], index: number) {
  const base = ["Lesson text", "Notebook"];
  const lower = label.toLowerCase();

  if (lower.includes("poster") || lower.includes("map") || lower.includes("picture")) {
    return [...base, "Markers", "Poster paper"];
  }

  if (lower.includes("song") || lower.includes("rap") || lower.includes("sermon")) {
    return [...base, "Script notes", effort === "high" ? "Phone for recording" : "Presentation space"];
  }

  if (lower.includes("museum") || lower.includes("social media") || lower.includes("video")) {
    return [...base, "Laptop or tablet", "Slides or design tool"];
  }

  return [...base, index % 2 === 0 ? "Partner discussion" : "Simple art supplies"];
}

function summarizeSource(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.split(/[.!?]/)[0]?.slice(0, 140) || "the main reading";
}

function extractLearningGoals(text: string) {
  const snippet = text.replace(/\s+/g, " ").trim();
  const firstSentence = snippet.split(/[.!?]/)[0] || "the reading";

  return [
    "Explain the main message of the reading in your own words.",
    "Use evidence from the text to support an interpretation.",
    `Connect the lesson in "${firstSentence.slice(0, 50)}" to lived experience or moral choice.`
  ];
}

function parseModelJson(text: string) {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("The model returned an empty response.");
  }

  const codeFenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = codeFenceMatch ? codeFenceMatch[1] : trimmed;
  return JSON.parse(candidate);
}

function makeFallbackImage(title: string, prompt: string, tier: string) {
  const palette = tierPalette(tier);
  const safeTitle = escapeHtml(title);
  const safePrompt = escapeHtml(prompt.slice(0, 120));
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette[0]}" />
          <stop offset="100%" stop-color="${palette[1]}" />
        </linearGradient>
      </defs>
      <rect width="1024" height="1024" fill="url(#bg)" rx="48" />
      <circle cx="220" cy="220" r="160" fill="rgba(255,255,255,0.10)" />
      <circle cx="860" cy="210" r="120" fill="rgba(255,255,255,0.08)" />
      <circle cx="750" cy="790" r="180" fill="rgba(255,255,255,0.09)" />
      <rect x="100" y="670" width="824" height="220" rx="36" fill="rgba(15,12,10,0.26)" />
      <text x="130" y="760" fill="#fff7ea" font-size="62" font-family="Georgia, serif" font-weight="700">${safeTitle}</text>
      <text x="130" y="835" fill="#ffefd7" font-size="28" font-family="Arial, sans-serif">${safePrompt}</text>
    </svg>
  `;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function tierPalette(tier: string) {
  switch (tier) {
    case "S":
      return ["#7b2d26", "#f4b266"];
    case "A":
      return ["#5f0f40", "#fb8b24"];
    case "B":
      return ["#264653", "#2a9d8f"];
    default:
      return ["#4f372d", "#c97b63"];
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
