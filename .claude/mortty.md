# Mortty context — sarab
- Single package, pnpm, Vite dev server (`pnpm dev`, launch config `sarab` on :5180). No backend, no DB.
- Stack: vanilla JS modules + CSS; config in public/config/*.json; clips in public/videos (encoded by scripts/encode.sh).
- Gates: AR + EN strings for every new copy; verify transitions in a visible browser (Playwright), not the hidden pane.
- Skip for now: db-migrate, security-audit (no PII, no endpoints), deploy.
