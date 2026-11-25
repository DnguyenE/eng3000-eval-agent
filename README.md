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

## Citation check

Every citation the agent gives is checked against the citation register in `src/config/citations.json`, and the results panel shows a citation check table: the citation, what the agent claimed, what the official source says, and the result (correct, partly correct, wrong, invented or not checked). A citation counts as checked only when the register records what the official source says and the date it was checked; anything else is shown as not checked.

To check a citation, read it on [Ontario e-Laws](https://www.ontario.ca/laws), the [Justice Laws Website](https://laws-lois.justice.gc.ca), the [Supreme Court of Canada](https://decisions.scc-csc.ca), PEO or Engineers Canada, then fill in `sourceSays`, `result` and `checked` for its entry. If the check finds the agent's wording wrong, correct `prompts/discipline.md` too.

```bash
npm run citations:table > docs/citation-check.md   # the citation check table for the report
```
