# Sarab — agent notes

Video-driven real-estate explorer POC. Read `docs/PLAN.md` first.

- No framework. `src/main.js` routes: `/` → `src/home.js` (project list), `/<id>` → `src/player.js` (the explorer). Plus `src/pano.js`, `src/style.css`, `index.html`. Keep it that way until the roadmap says otherwise.
- Projects: `public/projects/index.json` lists them (home copy + one entry per project). Each project is a folder `public/projects/<id>/` with `scenes.json` (view graph, hotspots, transitions, per-view `"panel": "closed"`), `content.json` (every user-facing string as `{ar, en}` + fabricated demo data), `videos/`, `panos/`. Adding a project = new folder + index entry + `scripts/clips/<id>.txt`; no code change.
- Paths are absolute (`/projects/...`, Vite `base: '/'`) because pages are served at `/<id>`; `vercel.json` rewrites non-asset paths to `index.html`.
- Every string ships in both Arabic and English. The UI is English only for now (toggle switched off in `home.js`/`player.js` until ayntwin.com is bilingual; Arabic was the default and will return as `dir=rtl`). Use Latin digits in both languages, and wrap units/currency in `<bdi>`.
- Panel sits on the physical right and the title on the bottom-left. When a view's hotspots fall under the panel, set `"panel": "closed"` on that view (it folds into a Details pill); an opened info pin shows its note in its own tag.
- Clips: never commit raw renders. `scripts/encode.sh <id> <raw-dir>` with `scripts/clips/<id>.txt`; web-ready H.264 1080p sources are copied (faststart only), others transcoded with a bitrate cap.
- 360° rooms: `src/pano.js` (three.js, loaded by dynamic import only when a room opens). Enable by adding `"pano": "panos/<file>.jpg"` to a hotspot. Body attribute `data-room` = state; buttons use `data-open` (never reuse `data-room` on buttons, since `closest()` would match `<body>`).
- Hotspot coordinates: open `/<id>?edit` and click.
- Verify in a visible browser. Videos do not play in a hidden tab, and `nextFrame` is capped so the app doesn't hang there.

## Models — the right model for each job
`fable` plans and judges, `opus` builds hard things, `sonnet` builds routine
things, `haiku` fetches.

| Job | Model |
|---|---|
| Main session: orchestrate, brief, verify, report | `fable` |
| Plan (architecture, multi-step plans) | `fable` |
| Read-only gates: code-reviewer, security-expert | `fable` |
| Builders on hard work (real state or data logic, auth, payments, migrations) | `opus` |
| Builders on routine work (UI, tests, small edits) | `sonnet` |
| Explore / investigators ("where is X") | `haiku`; `sonnet` for very thorough sweeps |

- Always pass `model` on the Agent tool — an unset model inherits the parent
  and spends the main session's limit on build work.
- A gate never runs on a weaker model than the builder it checks.
- The agent that builds a change never reviews it.
- Agent frontmatter in `.claude/agents/*.md` uses model aliases only, never dated IDs.

## Orchestrator only — delegate, do not do the work yourself
The main session plans, delegates, checks results, and reports back. It does
not write code, run builds, or do investigations itself.

Allowed in the main session:
- Talking to the user: asking questions, stating plans, reporting results.
- Reading only what is needed to brief a subagent or to check what it returned.
- Read-only git status or diff to confirm state.
- Gates that need the user: releases, production actions, merges, anything irreversible.

Everything else goes to a subagent:

| Work | Subagent |
|---|---|
| Find code, map callers, "where is X" | an explore agent |
| Plan a multi-step change | a planning agent |
| Write or change code | a builder agent (listed in `builderAgents` in `.claude/team-kit.json`) |
| Review a change | a gate agent (code reviewer, security reviewer) |
| Anything else | `general-purpose` |

How to delegate:
- Write each brief so it stands alone: the goal, file paths, the rules that apply,
  and what "done" means. A subagent starts with none of this conversation.
- Run independent subagents in parallel.
- Never switch branches in a shared checkout: another session may be working in it.
  A subagent that edits, branches, commits, or opens a PR works in its own worktree.
- Never trust a subagent's report on its own. Check it against the diff, the data, or the endpoint.
- Never let one agent grade its own work. The agent that builds a change never reviews it.
- If a subagent fails twice on the same task, stop and give the user 2–3 alternatives.

## Big scope — sub-sessions, not long subagents
A job is "big" when it has several independent deliverables or PRs, needs several
builders, or would keep agents running past ~30 minutes. For big jobs:
- Do not run the builds as long-lived subagents inside the main session. The main
  session fills up, gets compacted, and the owner loses track of state.
- Plan in the main session in one short page, then split the work into self-contained
  tasks and hand each one off as its own session and worktree (one deliverable, one PR each).
- Each task prompt stands alone: goal, branch and base, files, the rules that apply,
  tests, what "done" means, and what NOT to touch.
- The main session keeps only: the plan, a PR table (number, branch, status), owner
  decisions, independent review requests, and the owner gates (merge, release).
- Subagents in the main session are for short, bounded jobs only: one investigation,
  one review, one small fix. If one runs long, stop it and hand the rest off as a task.
- Keep state out of chat: record the PR table and decisions in a file, updated once per milestone.
- Tell every builder to work in small edits and commit per step; a single response over
  the output limit kills the agent mid-file.
