# RIVER — Product Identity

**Product:** RIVER
**Studio:** Pix3l LLC
**Founder:** Trey Secord
**Status:** Active Development
**Phase:** 1 — Web App

---

## What RIVER Is

RIVER is a lightweight, upload-first AI content pipeline built for small business owners. Users select a long-form video from their device, upload it to RIVER, and a coordinated team of AI agents handles everything from transcription to multi-platform publishing.

RIVER is not a content scheduler. It is not a social media manager. It is an intelligent pipeline that turns one uploaded video into fully distributed, platform-ready content across YouTube, TikTok, and Instagram — automatically.

---

## Positioning

**Primary tagline:** Upload once. Flow everywhere.

**Alt A:** Your video. Every platform. Zero effort.

**Alt B:** Drop it in. Let it run.

**Positioning statement:**
RIVER is the fastest path from long-form video to multi-platform reach. Upload your video, select your channels, and a coordinated team of AI agents handles everything from transcription to publishing. Built for small business owners who have real content but no time to distribute it.

---

## How RIVER Differs From Cascade

| | Cascade | RIVER |
|---|---|---|
| Source input | Ingests from TikTok | Upload from device |
| User type | Power user | Small business owner |
| Complexity | Enterprise pipeline | Guided, focused flow |
| Entry point | Platform account required | Device file upload |

RIVER is the lighter, more accessible sibling. Same Pix3l quality and agent architecture — without the setup overhead.

---

## Target Audience

**Primary:** Small business owners

People who create real video content (walkthroughs, demos, testimonials, behind-the-scenes) but lack the time, tools, or team to distribute it effectively. They are not content creators by trade. They are operators who want their content to work harder without more effort from them.

**Pain points:**
- Film good content, never post it consistently
- No time to reformat, caption, and publish across platforms
- No dedicated marketing team
- Unfamiliar with platform-specific best practices

**Outcome they want:** Record once, show up everywhere.

---

## Publishing Platforms

- YouTube
- TikTok
- Instagram

All publishing agents must include AI-generated content disclosure per platform API requirements.

---

## Agent Pipeline

RIVER uses eight coordinated AI agents. Each agent owns one stage and passes structured output to the next.

| Stage | Agent | Responsibility |
|---|---|---|
| 01 | Transcription Agent | Converts uploaded video to accurate transcript using Whisper/WhisperX |
| 02 | Copywriting Agent | Generates platform-native captions, titles, and descriptions from transcript |
| 03 | Brand Voice Agent | Aligns all copy to the user's defined brand tone and voice |
| 04 | Clip Selection Agent | Identifies high-value moments for short-form cuts |
| 05 | Thumbnail Agent | Creates thumbnail concepts and directs generation per platform spec |
| 06 | Scheduling Agent | Determines optimal post timing per platform and audience |
| 07 | Publishing Agent | Distributes finalized content to YouTube, TikTok, and Instagram with required disclosures |
| 08 | Feedback Agent | Pulls performance data post-publish and surfaces insights for the next run |

---

## Core Principles

These principles govern all RIVER product decisions and agent behavior.

1. **Human in the Loop** — Users review and approve before any content is published. Agents assist, not dictate.
2. **Transparency** — Every agent surfaces what it did and why. No black boxes.
3. **Upload simplicity** — The entry point is a single file from the user's device. No platform account required to start.
4. **Brand fidelity** — Copy always reflects the user's voice, not a generic AI output.
5. **Platform intelligence** — Each platform gets content formatted to its spec, not a one-size-fits-all post.
6. **AI disclosure first** — All published content includes required AI-generated disclosure tags per platform API.

---

## Tech Stack

**Frontend:** React + Vite, Tailwind CSS, TypeScript
**Backend:** Hono + Drizzle + Supabase
**Job Queue:** BullMQ + Upstash Redis
**Video Processing:** FFmpeg
**Transcription:** Whisper / WhisperX / faster-whisper
**AI Orchestration:** Anthropic Claude (pipeline orchestrator + copywriting)
**Data Store:** Supabase
**Deployment:** Vercel (frontend) + Railway or Fly.io (backend)

---

## Visual Identity

**Color lead:** Vista Blue `#8599FF`
**Primary CTA:** Big Red `#FF1635`
**Accent:** Purple Sparkles `#A100FF`
**Background:** Dark Navy `#000947` / Deep Navy `#000623`

**Typography:**
- Display / Headings: Space Grotesk, weights 300 / 500 / 700
- Body: Inter or DM Sans, weight 500 standard
- Labels / Code: JetBrains Mono

**Design tone:** Calm, guided, focused. RIVER leads with Vista Blue rather than Big Red to signal a more accessible, lower-friction experience than Cascade. Same Pix3l quality standard. Lighter entry point.

---

## Brand Rules

- No em dashes anywhere in RIVER copy
- Product name is always "RIVER" — all caps, no exceptions
- AI is always framed as assisting the user, not replacing them
- Active voice throughout
- Copy is benefit-first, never feature-first

---

## Paperclip Agent Co-Author

All commits generated by Paperclip agents for this project must include the co-author line:

```
Co-authored-by: Paperclip <paperclip@pix3l.io>
```

---

## Open Decisions

- [ ] Final tagline selection (Primary recommended: "Upload once. Flow everywhere.")
- [ ] iOS app scope (Phase 2 — deferred, new task brief when ready)
- [ ] Clip selection output format (short-form only vs. also mid-form)
- [ ] Brand voice onboarding flow (how users define their tone on first run)