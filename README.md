# Lesson Remix Studio

MVP web app for remixing religion-class reading assignments into more engaging student project options.

## Stack

- Vite + React + TypeScript frontend
- Express + TypeScript API
- SQLite via `better-sqlite3`
- OpenAI for remix generation and optional image generation

## Features

- Teacher flow:
  - paste a lesson title and assignment text
  - generate remix options grounded in `ideas.md`
  - approve or hide options
  - save the assignment locally
- Student flow:
  - browse saved assignments
  - see only approved remix cards
  - expand a card to load an image and view the student-facing prompt

## Run

1. Install dependencies:

```bash
npm install
```

2. Optional: add an OpenAI API key.

```bash
cp .env.example .env
```

3. Start the app:

```bash
npm run dev
```

4. Open [http://localhost:5173](http://localhost:5173)

## Notes

- If `OPENAI_API_KEY` is missing, the app still works with deterministic fallback remix generation and SVG image placeholders.
- SQLite data is stored in `data/lesson-remix.db`.
- The remix catalog is parsed directly from `ideas.md`.
