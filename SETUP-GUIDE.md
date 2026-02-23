# TapToSpeak — Claude Code CLI Setup Guide

## Prerequisites

You need on your MacBook Air M4:
- **Node.js 18+** (`node --version`)
- **Claude Code CLI** (`claude --version`) — if not installed: `npm install -g @anthropic-ai/claude-code`

## Step-by-Step Setup

### 1. Create the project folder

```bash
mkdir ~/voicebridge
cd ~/voicebridge
```

### 2. Copy the three files into the folder

Put these files from the download into `~/voicebridge/`:
- `CLAUDE.md` — Claude Code reads this automatically on startup
- `BUILD-TASKS.md` — phased build instructions
- `voicebridge.html` → rename to `reference-prototype.html` — working prototype for reference

```bash
# Assuming files are in Downloads:
cp ~/Downloads/CLAUDE.md ~/voicebridge/
cp ~/Downloads/BUILD-TASKS.md ~/voicebridge/
cp ~/Downloads/voicebridge.html ~/voicebridge/reference-prototype.html
```

### 3. Launch Claude Code

```bash
cd ~/voicebridge
claude
```

Claude Code will automatically read `CLAUDE.md` and understand the project.

### 4. Enable sandbox and give it the first prompt

First, enable sandbox mode so you're not clicking approve constantly:

```
/sandbox
```

Select **auto-allow mode**. Then paste your first message:

```
Read BUILD-TASKS.md and execute Phase 1. After completing Phase 1, stop and tell me what you built so I can verify before moving to Phase 2.
```

### 5. After Phase 1 verification

```
Phase 1 looks good. Execute Phase 2 — the Talk Screen. Use reference-prototype.html as the ground truth for all behavior and interactions.
```

### 6. Test on iPad after each phase

After each phase, deploy to Vercel to get a public URL you can open on any device:

```bash
# First time only — install Vercel CLI:
npm install -g vercel

# Deploy (run from the project folder):
npx vercel
```

Follow the prompts (say yes to defaults). It gives you a URL like:
`https://voicebridge-xxxxx.vercel.app`

Open that URL on iPad Safari — full screen, no local network needed. Each time you redeploy, the same URL updates automatically.

> **Tip**: After the first deploy, you can just run `npx vercel` again to push updates. Takes about 10 seconds.

To test on iPad as a PWA: Safari → Share → Add to Home Screen.

### 7. Continue through phases

```
Phase 2 verified. Execute Phase 3 — Profile, Settings, and Care screens.
```

```
Phase 3 verified. Execute Phase 4 — PWA configuration and build.
```

---

## Tips for Best Results with Claude Code

1. **Phase by phase** — don't ask it to build everything at once. Verify each phase.
2. **Reference the prototype** — if something doesn't match, say "This doesn't match the behavior in reference-prototype.html. The speech bar should..."
3. **Be specific about bugs** — "The category tabs aren't respecting the XL size setting" is better than "it looks wrong"
4. **Let it run tests** — Claude Code can run `npm run dev` and verify things itself
5. **If it goes off track** — say "Stop. Read CLAUDE.md again, specifically the section on [topic]."

## Sandbox Mode

Claude Code has built-in sandbox mode. Once inside Claude Code, run:

```
/sandbox
```

Select **auto-allow mode**. This lets Claude Code create files, run commands, and install packages without asking permission for every single action — while still keeping it safely sandboxed to the project directory. For a brand new project in an empty folder, this is the ideal setup.

If you skip sandbox mode, you'll be clicking "approve" constantly, which gets old fast.

## Estimated Timeline

| Phase | Time | What You Get |
|-------|------|-------------|
| Setup + Phase 1 | 10-15 min | Project scaffolded, state management, utilities |
| Phase 2 + deploy | 15-25 min | Working Talk screen → `npx vercel` → test on iPad |
| Phase 3 + deploy | 10-15 min | All 4 screens complete → redeploy → test on iPad |
| Phase 4 + deploy | 5-10 min | Installable PWA → final deploy → Add to Home Screen |
| **Total** | **~45-60 min** | **Production-ready PWA on iPad** |
