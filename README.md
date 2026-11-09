# Project Evaluation Agent
 
ENG 3000 Part 2. A chat agent that evaluates an engineering project against Ontario professional obligations (Q1), the law (Q2), and benefit to the land (Q3), then gives a recommendation.

Built with React + Vite, hosted on Vercel. Uses Groq's free API, with Gemini as a backup.

## Setup

```bash
npm install
cp .env.example .env.local   # add your Groq and/or Gemini key
npm run check:keys           # confirms each key and model works
npm run dev
```

Free keys: [Groq](https://console.groq.com/keys), [Gemini](https://aistudio.google.com/apikey)

## Deploy

Import the repo on Vercel, add `GROQ_API_KEY` and `GEMINI_API_KEY` as environment variables, and deploy.

## Editing the agent

The prompts are in `prompts/`:

- `discipline.md` - engineering field and relevant laws
- `decision-rule.md` - scoring and verdict rules
- `system-prompt.md` - general behaviour
- `report-format.md` - output format used by the results panel

The example test cases are in `src/config/examples.ts`.
