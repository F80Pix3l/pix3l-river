# River Brand — Pix3l Design System

A living reference for every color, type rule, motion spec, and component pattern built across the Pix3l website. Use this as ground truth for any new page or component.

---

## Color Palette

### Primary Brand Colors

| Token | Hex | Usage |
|---|---|---|
| Big Red | `#FF1635` | Primary CTA buttons, high-energy accents, scrollbar hover |
| Pinky | `#FF1673` | Secondary accent, hover states, subnav active, focus rings |
| Purple | `#A100FF` | Creative accent, glow effects, pipeline indicators |
| Vista Blue | `#8599FF` | Softer UI accents, sub-labels, secondary stat numbers |

### Dark Mode Backgrounds (default)

| Token | Hex | Usage |
|---|---|---|
| Dark Navy | `#000623` | Deepest background layer, footer |
| Navy | `#000947` | Dark section backgrounds, card surfaces |
| Night | `#0A0A0A` | Near-black surface alternative |

### Light Mode Backgrounds

| Token | Hex | Usage |
|---|---|---|
| Lavender White | `#F2EFFF` | Light mode body, hero, footer |
| Lavender Mid | `#EAE4FF` | Light mode section mid-tone |
| Lavender Deep | `#DDD8FF` | Light mode deep sections |
| Lavender Dark | `#E4DCFF` | Light mode darkest sections |

### Light Mode Text

| Token | Hex | Usage |
|---|---|---|
| Ink | `#0D0020` | Primary headings + body in light mode |
| Slate | `#5A5270` | Secondary body copy in light mode |
| Muted Purple | `#7A6A9A` | Tertiary / stat labels in light mode |
| Deep Purple | `#6B00CC` | Section labels, badge text in light mode |
| Vista Blue (light) | `#4A55C0` | Vista blue replacement in light mode |

### Dark Mode Text

| Token | Hex | Usage |
|---|---|---|
| White | `#FFFFFF` | Primary headings |
| White/55 | `rgba(255,255,255,0.55)` | Nav links (idle) |
| White/45 | `rgba(255,255,255,0.45)` | Subheadings, secondary copy |
| White/38 | `rgba(255,255,255,0.38)` | Subnav links (idle) |
| White/25 | `rgba(255,255,255,0.25)` | Footer copyright, tertiary labels |
| Muted | `#A3A3A3` | Body paragraph copy |

### Borders & Surfaces

| Context | Value |
|---|---|
| Dark card border (default) | `rgba(255,255,255,0.06)` |
| Dark card border (hover) | `rgba(255,22,115,0.20)` or `rgba(255,22,53,0.20)` |
| Light card border (default) | `rgba(161,0,255,0.10)` |
| Light card border (hover) | `rgba(161,0,255,0.22–0.28)` |
| Light surface (card bg) | `rgba(255,255,255,0.90–0.97)` |
| Dark surface (card bg) | `rgba(255,255,255,0.03–0.06)` or `rgba(0,9,71,0.4)` |
| Glassmorphism panel | `rgba(0,6,35,0.75)` |

---

## Typography

Three-font system. Never mix roles or substitute neutral system fonts.

### Display / Headings — Space Grotesk

```
font-family: 'Space Grotesk', sans-serif;
weights: 300 (light), 500 (medium), 700 (bold)
tracking: -0.03em on large display sizes
line-height: 1.1–1.2 for hero headings
```

- Hero headings: `clamp(2.5rem, 7vw, 5.5rem)`, weight 700, tracking `-0.03em`
- Section headings: `clamp(2rem, 4vw, 3.5rem)`, weight 700
- Card headings: `1.125rem–1.5rem`, weight 600–700
- Eyebrow labels: Space Grotesk or JetBrains Mono depending on context

### Body — Inter

```
font-family: 'Inter', sans-serif;
weight: 500 standard, 700 emphasis, 300 secondary
line-height: 1.7
```

- Standard paragraphs: `1rem`, weight 500, color `#A3A3A3` (dark) / `#5A5270` (light)
- Lead copy: `1.125rem–1.25rem`, weight 400–500, color `rgba(255,255,255,0.70)`
- Small labels: `0.75rem–0.875rem`

### Monospace — JetBrains Mono

```
font-family: 'JetBrains Mono', monospace;
weight: 500
letter-spacing: 0.10em–0.14em
text-transform: uppercase (for labels)
```

- Subnav links: `10px`, weight 500, `letter-spacing: 0.10em`, uppercase
- Drawer section labels: `9px`, weight 500, `letter-spacing: 0.14em`, uppercase
- Technical data, code blocks, copyright lines

---

## Spacing

Base-8 scale. Do not use arbitrary values.

| Token | Value |
|---|---|
| `--space-1` | `4px` |
| `--space-2` | `8px` |
| `--space-4` | `16px` |
| `--space-6` | `24px` |
| `--space-8` | `32px` |
| `--space-12` | `48px` |
| `--space-16` | `64px` |

Section vertical padding: `80px–120px` (`py-20` to `py-32` in Tailwind scale).
Container max-width: `80rem` (`max-w-7xl`), centered with `mx-auto px-6`.

---

## Gradients

### Hero Backgrounds (dark mode)

Layered radial gradients on a deep navy base. Standard pattern:

```css
background:
  radial-gradient(ellipse 70% 60% at 80% 20%, rgba(255,22,53,0.12) 0%, transparent 60%),
  radial-gradient(ellipse 50% 50% at 15% 80%, rgba(161,0,255,0.10) 0%, transparent 55%),
  #000623;
```

Variants swap orb positions and colors depending on product personality:
- Cascade: red top-right, purple bottom-left
- CRUNCH: orange/amber accent
- VIKI: blue-purple
- AiX: purple top-right, blue bottom-left

### Section Backgrounds (dark mode)

```css
/* Typical dark section */
background: linear-gradient(180deg, #000623 0%, #000947 50%, #000623 100%);
```

Always chain: the end-color of each section matches the start-color of the next.

### Section Backgrounds (light mode)

```css
/* Typical light section chain */
#F2EFFF → #EDE8FF → #E8E2FF → #E4DCFF → #DDD8FF → back up
```

Each section uses `linear-gradient(180deg, ...)` with the chain flowing visually downward.

### Grain / Texture

All large surface sections use an SVG noise filter grain overlay for depth:

```html
<div class="absolute inset-0 opacity-[0.03] pointer-events-none"
     style="background-image: url('data:image/svg+xml,...noise filter...')"></div>
```

---

## Shadows

Never use flat single-layer shadows. Always layer two to three levels with color tinting.

### Card Shadow (dark mode)

```css
box-shadow:
  0 4px 24px rgba(0,0,0,0.25),
  0 1px 6px rgba(0,0,0,0.15);
```

### Card Shadow (hover, dark mode)

```css
box-shadow:
  0 16px 44px rgba(0,0,0,0.35),
  0 4px 12px rgba(0,0,0,0.20);
```

### Card Shadow (light mode)

```css
box-shadow:
  0 4px 20px rgba(100,60,180,0.07),
  0 1px 4px rgba(0,0,0,0.05);
```

### Card Shadow (hover, light mode)

```css
box-shadow:
  0 12px 36px rgba(100,60,180,0.12),
  0 2px 8px rgba(0,0,0,0.06);
```

### Floating / Modal Shadow

```css
box-shadow:
  0 8px 40px rgba(100,60,180,0.14),
  0 2px 10px rgba(0,0,0,0.06);
```

---

## Animations

Only ever animate `transform` and `opacity`. Never `transition-all`.

### Standard Easing

```css
transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
```

### Hover Lift

```css
transition: transform 0.25s cubic-bezier(0.4,0,0.2,1), box-shadow 0.25s ease;
/* on hover: */
transform: translateY(-2px);
```

### Theme Toggle Spring

```css
transition: background 0.2s ease, color 0.2s ease,
            transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
/* on hover: transform: scale(1.1); */
/* on active: transform: scale(0.95); */
```

### Scroll Reveal

Elements start hidden and reveal on IntersectionObserver fire:

```css
.reveal {
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 0.6s cubic-bezier(0.4,0,0.2,1),
              transform 0.6s cubic-bezier(0.4,0,0.2,1);
}
.reveal.visible {
  opacity: 1;
  transform: none;
}
```

crunch.html uses the `[data-reveal]` / `.revealed` variant instead.

### Glow Border Effect (`glow.js` / `glow.css`)

Conic gradient that tracks cursor position. Rendered via a `.pix3l-glow` pseudo-element inserted as first child:

```css
background: conic-gradient(
  from calc(var(--glow-start, 0deg) - 10deg) at var(--glow-x, 50%) var(--glow-y, 50%),
  transparent 0deg,
  #A100FF 30deg,
  #8599FF 70deg,
  #FF1673 110deg,
  #FF1635 145deg,
  transparent 180deg,
  transparent 360deg
);
```

Cards that use glow: `.product-card`, `.agent-card`, `.agent-portrait`, `.feature-card`, `.cap-card`, `.aix-card`, `.principle-card`.
Inset variants (no bleed): `.lifecycle-step`, `.agent-thumb`, `.invoice-mockup`, `.cta-box`, `.step-card`, `.capture-card`, `.portrait-ring`, `.mockup-shell`.

### Reduced Motion

Every animation block requires:

```css
@media (prefers-reduced-motion: reduce) {
  /* disable or set transition: none */
}
```

---

## Interactive States

Every clickable element requires all three states. No exceptions.

```css
/* Pattern */
.element { /* idle */ }
.element:hover { /* visible color or transform change */ }
.element:focus-visible { outline: 2px solid #FF1673; outline-offset: 4px; border-radius: 2px; }
.element:active { transform: scale(0.97); }
```

---

## Buttons

### Primary (`.btn-primary`)

```css
background: #FF1635;
color: #fff;
padding: 10px 20px;
font-size: 14px;
font-family: Space Grotesk;
font-weight: 600;
border-radius: 6px;
/* hover: background: #e01030 or darken slightly */
/* active: scale(0.97) */
```

### Outline (`.btn-outline`)

```css
border: 1px solid rgba(255,255,255,0.22);
color: rgba(255,255,255,0.80);
background: transparent;
/* hover: border-color: rgba(255,255,255,0.40); background: rgba(255,255,255,0.04); */
/* light mode: border rgba(13,0,32,0.22), color #0D0020 */
```

### Ghost (`.btn-ghost`)

Same as outline but used in inline/text contexts. Lighter visual weight.

### Secondary (`.btn-secondary`)

```css
border: 1px solid rgba(255,255,255,0.20);
color: rgba(255,255,255,0.75);
/* Used for back-links and soft CTAs */
```

---

## Navigation

### Structure

Two-tier sticky nav, `position: fixed; top: 0; inset-x: 0; z-index: 50`.

**Primary bar** — 64px height, 3-column grid on desktop (logo | center links | right actions):
- Left: PIX3L logo (`#nav-logo`)
- Center: Global product links (`.global-nav-link`) — Cascade, CRUNCH, VIKI, BILL3, Agents, Founder
- Right: theme toggle + CTA button + hamburger (mobile)

**Subnav** — 34px height, slides in after 64px scroll. Page-specific anchor links (`.subnav-link`). Active link tracked by IntersectionObserver.

```css
scroll-padding-top: 100px; /* compensates for nav + subnav */
scrollbar-gutter: stable;  /* prevents layout shift */
```

### Global Nav Link States

```css
.global-nav-link { color: rgba(255,255,255,0.55); }
.global-nav-link:hover { color: #fff; }
.global-nav-link:hover::after { width: 100%; background: #FF1635; } /* underline sweep */
.global-nav-link.current { color: #fff; }
.global-nav-link.current::after { width: 100%; background: #FF1673; }
```

### Scrolled State (dark mode)

```css
background: rgba(0,4,22,0.75);
backdrop-filter: blur(24px);
box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,4,22,0.25);
```

### Scrolled State (light mode)

```css
background: rgba(242,239,255,0.95);
backdrop-filter: blur(20px) saturate(180%);
box-shadow: 0 8px 32px rgba(161,0,255,0.08), 0 2px 8px rgba(0,0,0,0.08);
```

### Scrollbar (custom, all pages)

```css
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: #000623; }
::-webkit-scrollbar-thumb { background: #000947; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #FF1635; }
/* light mode: track #F2EFFF, thumb #C8BEFF */
```

---

## Cards

### Product Card

Dark surface with image, gradient overlay, glow effect on hover. Border `rgba(255,255,255,0.06)`, radius `12px–16px`. Hover: lift + border color shifts to red/pink.

### Agent Card

Portrait image with bottom gradient fade to dark navy. Name + role in card footer. Glow border on hover.

### Feature / Principle Card

Icon + heading + body. Border `rgba(255,255,255,0.06)`. Top-edge accent color on `::before` pseudo-element (suppressed when glow is active).

### Pipeline / Step Card

Numbered step with icon. Consistent 12px radius. Hover: border to purple family.

### Stat Card

Large number in Vista Blue or gradient text, label below in muted. No heavy border.

### Glassmorphism Panel

```css
background: rgba(0,6,35,0.75);
border: 1px solid rgba(255,255,255,0.08);
backdrop-filter: blur(12px);
/* light mode: rgba(242,239,255,0.88), border rgba(161,0,255,0.14) */
```

---

## Images

- Always add a gradient overlay on hero and card images:
  ```css
  background: linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%);
  ```
- Add a `mix-blend-multiply` color treatment layer on brand images where appropriate.
- Hero images on agent pages use `object-fit: cover` with the face centered.

---

## Depth System

Three visual planes. Never place all elements at the same z-level.

| Layer | Description | Example |
|---|---|---|
| Base | Background, section fills | `#000623`, radial gradients |
| Elevated | Cards, panels | `rgba(0,9,71,0.4)` surface |
| Floating | Nav, modals, tooltips | glassmorphism + `z-index: 50` |

---

## Footer

Standard footer pattern across all pages:

- Top: logo + tagline / nav column(s) + product column(s)
- Bottom: copyright line (JetBrains Mono, `11px`, `text-white/25`) + Privacy Policy link (same style)
- Layout: `justify-between` on bottom row
- Background: `#000623` (dark) / `#EDE8FF` (light)
- Border-top: `rgba(255,255,255,0.06)` (dark) / `rgba(161,0,255,0.10)` (light)

---

## Voice and Copy

- No em dashes anywhere. Use colons, commas, or periods.
- No corporate filler: no "leverage," "robust," "cutting-edge," "synergies."
- No hedging: no "we think," "possibly," "might."
- Active voice throughout.
- Product names are exact: **Cascade**, **CRUNCH**, **VIKI**, **BILL3**, **AiX**.
- Agent names: Atlas, Chronos, DaVinci, Echo, Iris, Nikola, Nova, Oracle, Syra, VIKI.
- Headlines are bold, direct, outcome-focused.
- Sub-copy is one to two sentences, punchy, no padding.

---

## Asset Paths

All assets relative to project root (`/`).

| Asset | Path |
|---|---|
| Favicon | `favicon.svg` |
| Logo (dark, with tagline) | `assets/logos/logo-digital-works-white.svg` |
| Logo (dark, no tagline) | `assets/logos/logo-meet-dark-white.svg` |
| Hero background | `assets/images/hero/welcome-hero.png` |
| Agentic Blocks | `assets/images/backgrounds/agentic-blocks.png` |
| Digital Wave | `assets/images/backgrounds/digital-wave.png` |
| Isometric icons | `assets/images/isometric/` |
| Cascade logo | `assets/cascade/cascade-logo.svg` |
| Agent portraits | `assets/cascade/agents/{name}.png` |
| Agent animations | `assets/cascade/agents/echo-animation.mp4`, `assets/videos/syra-animated.mp4` |
| Bio photo | `assets/images/bio/Trey-Secord-Bio.webp` |

Agent names for portrait paths: `atlas`, `chronos`, `davinci`, `echo`, `iris`, `nikola`, `nova`, `oracle`, `syra`, `viki`.

---

## Tech Stack (frontend)

| Tool | Usage |
|---|---|
| Tailwind CSS (CDN) | Utility classes for layout, spacing, flex, grid |
| Space Grotesk | Google Fonts — display headings |
| Inter | Google Fonts — body copy |
| JetBrains Mono | Google Fonts — monospace / labels |
| `glow.js` + `glow.css` | Shared cursor-tracking glow border effect |
| `nav.js` + `nav.css` | Shared nav scroll + subnav + hamburger |
| `theme.js` + `theme.css` | Shared light/dark toggle |
| `serve.mjs` | Local dev server at `localhost:3000` |

Tailwind container plugin must be disabled on pages with a custom `.container` class:
```html
<script>tailwind.config = { corePlugins: { container: false } }</script>
```

---

## Page Inventory

| Page | File | Notes |
|---|---|---|
| Homepage | `index.html` | Main marketing hub |
| Cascade | `cascade.html` | AI pipeline product |
| CRUNCH | `crunch.html` | Data cleaning product; own CSS system |
| Agents | `agents.html` | Agent roster overview |
| AiX | `aix.html` | AI design philosophy |
| VIKI | `viki.html` | Conversational interface |
| BILL3 | `bill3.html` | Time tracking + invoicing agent |
| Bio | `bio.html` | Founder profile |
| Cascade Architecture | `cascade-architecture.html` | Technical diagram |
| CRUNCH Architecture | `crunch-architecture.html` | Technical diagram |
| BILL3 Architecture | `bill3-architecture.html` | Technical diagram |
| Privacy Policy | `privacy-policy.html` | Legal |
| Agent sub-pages | `agents/{name}.html` (10 pages) | Relative paths use `../` |
