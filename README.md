# Project Evaluation Agent (ENG 3000, Part 2)

An AI agent that evaluates a proposed engineering project the same way as our Project Evaluation Platform:

- **Q1** Professional obligations (Professional Engineers Act, O. Reg. 941)
- **Q2** Law of the land (Building Code, AODA, OHSA, environmental and constitutional law)
- **Q3** Benefit to the land (sustainability, Indigenous rights, equity and accessibility)

It shows the three results side by side, flags where they conflict, applies the decision rule, and recommends **proceed**, **proceed with conditions**, or **do not proceed**. It asks for missing information, cites specific provisions, says when it is uncertain, and refuses to invent law.

Free to build, host and use: React (Vite) on Vercel's free Hobby plan, with free-tier LLM APIs (Groq, falling back to Google Gemini). Visitors do not need to sign in.

## How it works

```
Browser (React)  --POST /api/chat-->  Vercel Function (api/chat.ts)  -->  Groq, then Gemini if Groq fails
                 <--streamed text---
```

- `api/chat.ts` is the only server code. Vercel deploys it automatically with the site. It keeps the API keys secret, builds the system prompt from `prompts/`, and streams the reply.
- The model ends each assessment with a JSON block. The app reads it and draws the results panel.
- Basic abuse limits: message length and history caps, a reply token cap, and a per-IP rate limit (20 requests per 10 minutes).

## Changing the agent's context and prompts

Everything the agent knows lives in `prompts/`. No code changes are needed.

| File | What to edit |
| --- | --- |
| `prompts/discipline.md` | Your engineering field and its acts, codes and standards. **Fill this in once your group picks its Part 1 field.** |
| `prompts/decision-rule.md` | The scoring scheme and decision rule from your Evaluation Platform. |
| `prompts/system-prompt.md` | Core behaviour (ask for missing info, cite provisions, admit uncertainty, resist pressure). |
| `prompts/report-format.md` | The output format and the JSON shape the results panel reads. Change carefully. |
| `src/config/examples.ts` | The three test-case buttons (Known case, Planted problems, Stress test). |

The files are joined in that order (system prompt, discipline, decision rule, report format). HTML comments (`<!-- -->`) are stripped before sending. Locally, edits apply on the next message. On Vercel, redeploy (push to GitHub).

**Reproducibility:** click **System prompt** in the app to copy or download the full combined prompt. Pasting it into any free chatbot gives roughly the same agent, as the brief requires.

## Getting free API keys (no credit card)

1. **Groq** (primary): sign in at [console.groq.com](https://console.groq.com) and create a key under **API Keys**.
2. **Google Gemini** (fallback): sign in at [aistudio.google.com/apikey](https://aistudio.google.com/apikey) and click **Create API key**.

You only need one, but having both keeps the agent working when one hits its free daily limit. Free-tier limits change, so check each console's **Limits** page. On Groq, `llama-3.3-70b-versatile` has a fairly small daily token budget; if you run out, add a second model, for example `GROQ_MODEL=llama-3.3-70b-versatile,meta-llama/llama-4-scout-17b-16e-instruct`. Note that Google may use free-tier Gemini prompts to improve its products, so do not enter personal information.

## Run locally

Requires Node 20 or newer.

```bash
npm install
cp .env.example .env.local   # then paste your keys into .env.local
npm run dev                  # http://localhost:5173
```

`npm run dev` serves `/api/chat` too, so no Vercel account is needed for local testing.

## Deploy to Vercel (free)

1. Push this repo to GitHub.
2. On [vercel.com](https://vercel.com), sign in with GitHub, click **Add New... > Project**, and import the repo. Vercel detects Vite automatically.
3. Under **Environment Variables**, add `GROQ_API_KEY` and `GEMINI_API_KEY` (and optionally `GROQ_MODEL`, `GEMINI_MODEL`).
4. Click **Deploy**.
5. Share the **production** URL (for example `https://your-project.vercel.app`). Production URLs are public. Preview URLs for branches may require a Vercel login because of Vercel's default Deployment Protection, so do not share those with TAs.

After changing environment variables, redeploy for them to take effect.

## Suggested tests (from the brief)

- **Known case:** describe a Part 1 case as a proposal before construction. Does the agent find the problems you found?
- **Planted problems:** a hypothetical project with two or three hidden problems. How many does it find?
- **Stress test:** cite a law that does not exist, give incomplete information, or pressure it to approve.

The three buttons on the home page load starter versions of each test. Replace them with your own in `src/config/examples.ts`.

## Limitations

Free models can be wrong or out of date, and may still cite a section incorrectly. Always verify citations against [Ontario e-Laws](https://www.ontario.ca/laws) and [Justice Laws](https://laws-lois.justice.gc.ca). This tool supports, and does not replace, a licensed engineer, legal advice and meaningful consultation.
