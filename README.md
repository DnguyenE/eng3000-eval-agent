# Project Evaluation Agent
 
ENG 3000 Parts 2 and 3. A chat agent that evaluates an engineering project against Ontario professional obligations (Q1), the law (Q2), and benefit to the land (Q3), then gives a recommendation.

Built with React + Vite, hosted on Vercel. Uses Gemini's free API, with Groq as a backup. Groq's free tier allows 8,000 tokens per minute, less than the system prompt, so Groq only works as the backup on a paid plan.

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

- `citations.json` - the citation register: every act, regulation, section and case the agent uses, with when to apply it and the result of checking it against the official source. This is the only place law is listed.
- `discipline.md` - engineering field and guidance on applying the law
- `decision-rule.md` - scoring and verdict rules
- `system-prompt.md` - general behaviour
- `report-format.md` - output format used by the results panel

To add a law, add its instrument (with a `group` of `field`, `q1`, `q2` or `q3`) and its checks to `citations.json`. Other prompt files refer to provisions by register ID in backticks, such as `` `ca1982-35` ``. `npm run citations:lint` (also run by `npm run build`) fails if a prompt file names an ID that does not exist or writes a citation out instead of using an ID.

The example test cases are in `src/config/examples.ts`.

## Part 3 run

The Part 3 project is the York University Station ventilation upgrade. Its files are in `docs/part3/`:

- `project.md` - the proposal, word for word as given to the platform
- `personas.md` - the five persona summaries (never the interview notes, which stay in the group drive)
- `change-log.md` - what changed in the agent since Part 2

To run the evaluation for the report:

1. Click the **Part 3: York Station ventilation** example. It fills in the proposal and personas from those files; send it.
2. Answer any questions the agent asks, without adding anything that could identify an interview participant.
3. Download the transcript (**Transcript** in the header) and the citation check table (**Download .md** or **.csv** on the Citation check card).
4. Check by hand any citation marked "Not checked", then record it in `prompts/citations.json`.

The persona concerns table in the results shows, for each persona, whether the project or the agent's conditions address what they raised.

## Citation check

The citation register in `prompts/citations.json` is added to the prompt as a list of IDs. The agent cites a listed provision by its ID and the app looks it up; anything else the agent relies on (a by-law, a standard, a section that isn't listed) it writes out in full, and the app shows it as not in the register so it can be checked by hand. The results panel shows a citation check table: the citation, what the agent claimed, what the official source says, and the result (correct, partly correct, wrong, invented or not checked). A citation counts as checked only when the register records what the official source says and the date it was checked; anything else is shown as not checked.

To check a citation, read it on [Ontario e-Laws](https://www.ontario.ca/laws), the [Justice Laws Website](https://laws-lois.justice.gc.ca), the [Supreme Court of Canada](https://decisions.scc-csc.ca), PEO or Engineers Canada, then fill in `sourceSays`, `result` and `checked` for its entry in `prompts/citations.json`. Nothing else needs updating: for a partly correct entry the agent is given what the source says, and an entry found wrong or invented is no longer sent to the agent.

```bash
npm run citations:table > docs/citation-check.md   # the citation check table for the report
```
