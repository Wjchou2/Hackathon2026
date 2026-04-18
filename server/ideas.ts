import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { IdeaTemplate } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ideasPath = path.resolve(__dirname, "../ideas.md");

export function loadIdeaCatalog() {
  const markdown = fs.readFileSync(ideasPath, "utf8");
  const lines = markdown.split(/\r?\n/);
  const ideas: IdeaTemplate[] = [];
  let currentTier = "Unranked";

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+?)\s+Tier$/);
    if (headingMatch) {
      currentTier = headingMatch[1].trim();
      continue;
    }

    if (!line.startsWith("- ")) {
      continue;
    }

    const raw = line.slice(2).trim();
    const effortSignal = raw.includes("(S)");
    const largeProject = raw.includes("(*)");
    const cleanLabel = raw.replace(/\s*\(S\)/g, "").replace(/\s*\(\*\)/g, "").trim();

    ideas.push({
      key: slugify(cleanLabel),
      label: cleanLabel,
      tier: currentTier,
      tags: cleanLabel
        .toLowerCase()
        .split(/[\/,:"]/)
        .map((entry) => entry.trim())
        .filter(Boolean),
      effortSignal,
      largeProject
    });
  }

  return ideas;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
