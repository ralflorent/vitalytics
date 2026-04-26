# Vitalytics — Design System

> Design direction for a health-focused, chat-centric PWA that feels
> **trustworthy**, **approachable**, and **modern** — like a knowledgeable
> companion, not a clinical dashboard.

---

## Table of Contents

1. [Design Principles](#1-design-principles)
2. [Color Palette](#2-color-palette)
3. [Typography](#3-typography)
4. [Spacing & Sizing](#4-spacing--sizing)
5. [Layout Patterns](#5-layout-patterns)
6. [Component Patterns](#6-component-patterns)
7. [Iconography](#7-iconography)
8. [Motion & Transitions](#8-motion--transitions)
9. [Accessibility](#9-accessibility)
10. [Implementation Notes](#10-implementation-notes)

---

## 1. Design Principles

| Principle | What it means | What to avoid |
|-----------|---------------|---------------|
| **Trust first** | Muted, professional palette. Clear hierarchy. No visual noise. | Bright neons, playful illustrations, gamification |
| **Calm over urgency** | Generous whitespace. Soft transitions. No flashing or pulsing. | Alert fatigue, red badges everywhere, countdown timers |
| **Readable at length** | Optimized for long medical text. Good line height, contrast, max-width. | Tiny fonts, low-contrast text, full-width paragraphs |
| **Approachable** | Warm accents, rounded corners, conversational tone. | Cold/sterile clinical aesthetic, dense data tables |
| **Transparent** | Show what's happening (processing, sending, masking). No black boxes. | Silent failures, hidden state, mystery spinners |

---

## 2. Color Palette

### Why teal?

The current green (`#00b96b`) leans mint/fintech. For a health app, **teal** is the
sweet spot — it bridges medical blue (trust, calm) with health green (vitality, safety),
while feeling distinctly modern. It's used by health brands like Zocdoc, Headspace, and
modern telehealth apps.

### 2.1 Primary — Teal

The main brand color. Used for primary actions, active states, and key accents.

```text
Teal 50   #F0FDFA   — lightest tint (backgrounds, hover fills)
Teal 100  #CCFBF1   — light tint (selected states, badges)
Teal 200  #99F6E4   — soft highlight
Teal 300  #5EEAD4   — decorative accents
Teal 400  #2DD4BF   — hover state for primary buttons
Teal 500  #14B8A6   — ★ PRIMARY — buttons, links, active indicators
Teal 600  #0D9488   — ★ PRIMARY ALT (slightly deeper, better on white)
Teal 700  #0F766E   — pressed state, text links on light bg
Teal 800  #115E59   — dark UI accent
Teal 900  #134E4A   — darkest (dark mode primary text)
```

**Primary action color:** `#0D9488` (Teal 600) — passes WCAG AA on white (4.54:1 contrast).
Use Teal 500 for larger elements (buttons, pills), Teal 600-700 for text links.

### 2.2 Secondary — Warm Amber

A warm complement to the cool teal. Used sparingly for attention, warmth, and
"human" moments (user messages, highlights, notifications).

```text
Amber 50   #FFFBEB
Amber 100  #FEF3C7
Amber 200  #FDE68A
Amber 300  #FCD34D
Amber 400  #FBBF24   — ★ accent for badges, highlights
Amber 500  #F59E0B   — ★ warm CTA, notification dots
Amber 600  #D97706   — hover on amber elements
Amber 700  #B45309
```

Use amber for: notification badges, "new" indicators, user avatar accent, star ratings,
and anywhere you want to add warmth without losing professionalism.

### 2.3 Neutrals — Slate

Avoid pure gray (feels cold/generic). Slate has a subtle blue undertone that pairs
naturally with teal and reads as more refined.

```text
Slate 50   #F8FAFC   — ★ page background (light mode)
Slate 100  #F1F5F9   — card backgrounds, input fields
Slate 200  #E2E8F0   — borders, dividers
Slate 300  #CBD5E1   — disabled states, placeholder text bg
Slate 400  #94A3B8   — placeholder text, secondary icons
Slate 500  #64748B   — secondary text, timestamps, metadata
Slate 600  #475569   — body text (light mode)
Slate 700  #334155   — ★ primary body text
Slate 800  #1E293B   — headings, high-emphasis text
Slate 900  #0F172A   — ★ darkest text / dark mode backgrounds
Slate 950  #020617   — true dark background
```

### 2.4 Semantic Colors

```text
Success    #10B981  (Emerald 500) — completed, healthy ranges
Warning    #F59E0B  (Amber 500)   — attention needed, out-of-range values
Error      #EF4444  (Red 500)     — failures, critical alerts
Info       #3B82F6  (Blue 500)    — informational, tips, help text
```

For health data specifically:

```text
Normal range     #10B981  (green)   — "within normal limits"
Borderline       #F59E0B  (amber)   — "slightly elevated / low"
Out of range     #EF4444  (red)     — "significantly abnormal"
Not evaluated    #94A3B8  (slate)   — "no reference range"
```

### 2.5 Chat-Specific Colors

```text
User message bg        #F0FDFA  (Teal 50)     — light teal wash
User message border    #99F6E4  (Teal 200)    — subtle left border
Assistant message bg   #FFFFFF                  — clean white
Assistant message border #E2E8F0 (Slate 200)   — subtle left border
System message bg      #F1F5F9  (Slate 100)   — muted background
System message text    #64748B  (Slate 500)   — de-emphasized
```

### 2.6 Dark Mode Palette

```text
Background             #0F172A  (Slate 900)
Surface / cards        #1E293B  (Slate 800)
Surface elevated       #334155  (Slate 700)
Border                 #475569  (Slate 600)
Text primary           #F1F5F9  (Slate 100)
Text secondary         #94A3B8  (Slate 400)
Primary                #2DD4BF  (Teal 400)    — brighter teal for dark bg
Primary text           #14B8A6  (Teal 500)
User message bg        #115E59  (Teal 800)    — dark teal
Assistant message bg   #1E293B  (Slate 800)
```

### 2.7 Full Palette Summary

| Role | Light Mode | Dark Mode |
|------|-----------|-----------|
| Background | `#F8FAFC` | `#0F172A` |
| Surface (cards) | `#FFFFFF` | `#1E293B` |
| Surface elevated | `#F1F5F9` | `#334155` |
| Border | `#E2E8F0` | `#475569` |
| Text primary | `#334155` | `#F1F5F9` |
| Text secondary | `#64748B` | `#94A3B8` |
| Text muted | `#94A3B8` | `#64748B` |
| Primary | `#0D9488` | `#2DD4BF` |
| Primary hover | `#14B8A6` | `#5EEAD4` |
| Primary surface | `#F0FDFA` | `#115E59` |
| Accent | `#F59E0B` | `#FBBF24` |

---

## 3. Typography

### 3.1 Font Stack

**Primary (UI):** Inter — clean, highly legible at all sizes, excellent for both UI and
reading. Free, variable-weight, widely used in modern health/tech apps.

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
             'Helvetica Neue', Arial, sans-serif;
```

**Load via Google Fonts** (variable, latin + latin-ext):

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

Or self-host via `@fontsource/inter` for better performance and privacy (recommended for a health app).

**Monospace (code/data):** For structured medical data, lab values, API logs:

```css
font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', monospace;
```

### 3.2 Type Scale

Based on a 1.25 ratio (Major Third), anchored at 16px body:

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| `display` | 30px / 1.875rem | 700 | 1.2 | App title, onboarding headlines |
| `h1` | 24px / 1.5rem | 700 | 1.3 | Page titles ("Analysis", "Settings") |
| `h2` | 20px / 1.25rem | 600 | 1.35 | Section headers, card titles |
| `h3` | 16px / 1rem | 600 | 1.4 | Subsection headers, sidebar titles |
| `body` | 15px / 0.9375rem | 400 | 1.6 | ★ Chat messages, general content |
| `body-sm` | 14px / 0.875rem | 400 | 1.5 | Secondary descriptions, metadata |
| `caption` | 12px / 0.75rem | 500 | 1.4 | Timestamps, labels, badges |
| `overline` | 11px / 0.6875rem | 600 | 1.3 | All-caps labels, category tags |

**Why 15px body?** Medical text is often dense and read for comprehension. 15px with
1.6 line-height hits the sweet spot between information density and readability on both
mobile and desktop. Going below 14px for any readable content is not recommended.

### 3.3 Font Weights

Use only these four weights to keep the system clean:

| Weight | Name | Usage |
|--------|------|-------|
| 400 | Regular | Body text, chat messages |
| 500 | Medium | Labels, buttons, navigation items |
| 600 | Semibold | Headings, emphasis, card titles |
| 700 | Bold | Display text, page titles, strong emphasis |

### 3.4 Text Colors

| Role | Light Mode | Dark Mode |
|------|-----------|-----------|
| Primary text | Slate 700 `#334155` | Slate 100 `#F1F5F9` |
| Secondary text | Slate 500 `#64748B` | Slate 400 `#94A3B8` |
| Muted text | Slate 400 `#94A3B8` | Slate 500 `#64748B` |
| Link text | Teal 700 `#0F766E` | Teal 400 `#2DD4BF` |
| Inverse text | White `#FFFFFF` | Slate 900 `#0F172A` |

---

## 4. Spacing & Sizing

### 4.1 Spacing Scale (4px base)

```text
--space-0:   0px
--space-1:   4px     — tight gaps (icon padding, badge padding)
--space-2:   8px     — compact spacing (between related elements)
--space-3:   12px    — default inner padding
--space-4:   16px    — ★ standard gap (between items in a list)
--space-5:   20px    — card padding
--space-6:   24px    — ★ section spacing
--space-8:   32px    — large section gaps
--space-10:  40px    — page section separation
--space-12:  48px    — major layout divisions
--space-16:  64px    — hero/splash spacing
```

### 4.2 Border Radius

```text
--radius-sm:    4px    — inputs, small buttons
--radius-md:    8px    — ★ cards, modals, dropdowns
--radius-lg:    12px   — chat bubbles, large cards
--radius-xl:    16px   — panels, sheets
--radius-full:  9999px — pills, avatars, circular buttons
```

The current 4px everywhere is too uniform. Use 8px as the default for cards and
containers, 12px for chat bubbles to feel softer/conversational.

### 4.3 Max Widths

```text
--max-content:    720px   — chat messages, long-form text (optimal read width)
--max-container:  1200px  — main app container
--max-sidebar:    320px   — conversation sidebar
--max-input:      480px   — form inputs, search bars
```

Chat messages should never stretch to full viewport width. Cap at ~720px for
comfortable reading. The current `max-width: 80%` on `Main` works but a fixed
max-width is more predictable.

### 4.4 Shadows

Subtle, layered shadows instead of heavy box-shadows:

```css
--shadow-sm:   0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md:   0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
--shadow-lg:   0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
--shadow-xl:   0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
```

Use `shadow-sm` for cards at rest, `shadow-md` on hover, `shadow-lg` for modals
and floating elements. The current `box-shadow: 0 4px 8px ...` on chat cards is
too heavy — replace with `shadow-sm`.

---

## 5. Layout Patterns

### 5.1 App Shell (desktop, >= 768px)

```text
┌──────────────────────────────────────────────────────────┐
│  Header: Logo + App Name           [Settings] [Profile]  │
├────────────────┬─────────────────────────────────────────┤
│                │                                         │
│  Sidebar       │  Main Content                           │
│  (320px)       │  (flex: 1)                              │
│                │                                         │
│  [New Chat]    │  ┌───────────────────────────────────┐  │
│                │  │  Chat Message (assistant)         │  │
│  Conversation  │  │  max-width: 720px                 │  │
│  List          │  └───────────────────────────────────┘  │
│                │                                         │
│  - Chat 1      │  ┌───────────────────────────────────┐  │
│  - Chat 2      │  │  Chat Message (user)              │  │
│  - Chat 3      │  │  aligned right, teal bg           │  │
│                │  └───────────────────────────────────┘  │
│                │                                         │
│                │  ┌───────────────────────────────────┐  │
│                │  │  [Attach] [Input area...] [Send]  │  │
│                │  └───────────────────────────────────┘  │
├────────────────┴─────────────────────────────────────────┤
│  Footer: Disclaimer · Privacy · Help                     │
└──────────────────────────────────────────────────────────┘
```

### 5.2 App Shell (mobile, < 768px)

```text
┌─────────────────────────┐
│  [☰]  Vitalytics        |
├─────────────────────────┤
│                         │
│  Chat Messages          │
│  (full width, padded)   │
│                         │
│  ┌───────────────────┐  │
│  │  Assistant msg    │  │
│  └───────────────────┘  │
│                         │
│  ┌───────────────────┐  │
│  │  User msg    ◀──  │  │
│  └───────────────────┘  │
│                         │
├─────────────────────────┤
│ [📎] [🎤] [Type...]  ▶   │
└─────────────────────────┘
```

Sidebar becomes a slide-out drawer on mobile, triggered by hamburger menu.

### 5.3 Grid Structure

Replace the current three-row grid with a more flexible layout:

```css
/* Desktop */
#app {
  display: grid;
  grid-template-columns: var(--max-sidebar) 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header  header"
    "sidebar main"
    "sidebar footer";
  height: 100vh;
}

/* Mobile */
@media (max-width: 767px) {
  #app {
    grid-template-columns: 1fr;
    grid-template-areas:
      "header"
      "main"
      "footer";
  }
}
```

---

## 6. Component Patterns

### 6.1 Chat Bubbles

```
┌──────────────────────────────────────────────────┐
│ ● Assistant · 2 min ago                          │
│                                                  │
│ Your hemoglobin level of 13.2 g/dL falls within  │
│ the normal range (12.0-17.5 g/dL for adults).    │
│                                                  │
│ This indicates your red blood cells are carrying │
│ oxygen effectively...                            │
│                                                  │
│                               [Copy] [Expand] ▾  │
└──────────────────────────────────────────────────┘
```

- **Assistant messages:** White/surface bg, left-aligned, slate left-border (2px)
- **User messages:** Teal-50 bg, right-aligned (or left with teal left-border)
- **System messages:** Centered, muted, smaller text, no border
- Border-radius: 12px (top), 4px on the "tail" corner
- Max-width: 85% of chat area on desktop, 95% on mobile
- Padding: 16px

### 6.2 Primary Button

```text
Background: Teal 600 (#0D9488)
Text:       White
Radius:     8px
Padding:    10px 20px
Font:       15px / Medium (500)
Shadow:     shadow-sm

Hover:      Teal 500 (#14B8A6), shadow-md
Active:     Teal 700 (#0F766E), shadow-sm
Disabled:   Slate 200 bg, Slate 400 text
```

### 6.3 Input Fields

```text
Background: White (light) / Slate 800 (dark)
Border:     1px solid Slate 200 (light) / Slate 600 (dark)
Radius:     8px
Padding:    10px 14px
Font:       15px / Regular
Placeholder: Slate 400

Focus:      Border → Teal 500, ring: 0 0 0 3px Teal-500/20%
Error:      Border → Red 500, ring: 0 0 0 3px Red-500/20%
```

### 6.4 Cards

```text
Background: White (light) / Slate 800 (dark)
Border:     1px solid Slate 200 (light) / Slate 700 (dark)
Radius:     8px
Padding:    20px
Shadow:     shadow-sm
Hover:      shadow-md (if interactive)
```

### 6.5 Sidebar Conversation Item

```text
Default:    transparent bg, Slate 700 text, Slate 500 timestamp
Hover:      Slate 100 bg
Active:     Teal 50 bg, Teal 700 left-border (3px), Teal 800 text
```

### 6.6 Badges & Pills

```text
Default:    Slate 100 bg, Slate 600 text, radius-full
Primary:    Teal 100 bg, Teal 700 text
Warning:    Amber 100 bg, Amber 700 text
Danger:     Red 100 bg, Red 700 text
```

### 6.7 Health Data Indicators

For displaying lab values, vital signs, or test results:

```text
┌─────────────────────────────────────┐
│  Hemoglobin                         │
│  13.2 g/dL          ● Normal        │
│  ▓▓▓▓▓▓▓▓▓░░░░ (12.0 — 17.5)        │
└─────────────────────────────────────┘
```

- Green dot + "Normal" for in-range values
- Amber dot + "Borderline" for near-boundary
- Red dot + "High/Low" for out-of-range
- Progress bar with the value's position in the reference range

---

## 7. Iconography

**Recommended:** Lucide icons — clean, consistent, 24x24 base, MIT licensed.
Already compatible with React (`lucide-react`). More cohesive than mixing Ant Design
icons with custom ones.

```text
yarn add lucide-react
```

Alternatively, keep `@ant-design/icons` for Ant components and use Lucide for
custom UI elements. Avoid mixing more than two icon sets.

**Icon sizing:**
| Context | Size |
|---------|------|
| Inline with text | 16px |
| Buttons / nav | 20px |
| Feature icons | 24px |
| Empty states / onboarding | 48px |

**Icon color:** Match the text color of its context (primary text, secondary text,
or primary brand color for emphasis).

---

## 8. Motion & Transitions

Health apps should feel **calm and purposeful**. Avoid bouncy, playful animations.

### 8.1 Timing

```css
--duration-fast:    120ms   — hover states, toggles
--duration-normal:  200ms   — reveals, collapses, fades
--duration-slow:    350ms   — page transitions, modals, sidebar
```

### 8.2 Easing

```css
--ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1);   — most transitions
--ease-out:     cubic-bezier(0, 0, 0.2, 1);       — entering elements
--ease-in:      cubic-bezier(0.4, 0, 1, 1);       — exiting elements
```

### 8.3 Specific Transitions

| Element | Transition |
|---------|-----------|
| Button hover | `background-color 120ms ease-in-out` |
| Card hover shadow | `box-shadow 200ms ease-in-out` |
| Sidebar slide | `transform 350ms ease-out` |
| Modal appear | `opacity 200ms ease-out, transform 200ms ease-out` (scale 0.95→1.0) |
| Chat message enter | `opacity 200ms ease-out, transform 200ms ease-out` (translateY 8px→0) |
| Theme switch | `background-color 350ms ease-in-out, color 350ms ease-in-out` |
| Skeleton shimmer | `background-position 1.5s ease-in-out infinite` |

### 8.4 Loading States

- **Chat waiting:** Typing indicator (three dots pulsing) in an assistant bubble
- **File processing:** Skeleton placeholder with shimmer, progress percentage
- **Page navigation:** Subtle fade (200ms), not a full-page spinner
- **AI processing:** Inline "Analyzing..." text with a calm pulse, not a spinner

---

## 9. Accessibility

### 9.1 Color Contrast Requirements

All text must meet **WCAG AA** (4.5:1 for body text, 3:1 for large text):

| Combination | Ratio | Pass |
|-------------|-------|------|
| Slate 700 on White | 7.14:1 | AA, AAA |
| Slate 600 on White | 5.35:1 | AA |
| Slate 500 on White | 3.94:1 | AA Large only |
| Teal 600 on White | 4.54:1 | AA |
| Teal 700 on White | 5.79:1 | AA, AAA |
| White on Teal 600 | 4.54:1 | AA |
| Slate 100 on Slate 900 | 13.5:1 | AA, AAA |

### 9.2 Focus Indicators

Never remove focus outlines. Style them:

```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### 9.3 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 9.4 Screen Reader Considerations

- Chat messages: use `role="log"` and `aria-live="polite"` on the message list
- Loading states: `aria-busy="true"` on the container
- File upload: clear `aria-label` describing accepted formats
- Health indicators: don't rely on color alone (add text labels "Normal", "High", etc.)

---

## 10. Implementation Notes

### 10.1 CSS Custom Properties (Design Tokens)

Define tokens as CSS custom properties for easy theming:

```css
:root {
  /* Primary */
  --color-primary: #0D9488;
  --color-primary-hover: #14B8A6;
  --color-primary-pressed: #0F766E;
  --color-primary-surface: #F0FDFA;

  /* Accent */
  --color-accent: #F59E0B;
  --color-accent-surface: #FFFBEB;

  /* Neutral */
  --color-bg: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-surface-elevated: #F1F5F9;
  --color-border: #E2E8F0;
  --color-text-primary: #334155;
  --color-text-secondary: #64748B;
  --color-text-muted: #94A3B8;

  /* Semantic */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;

  /* Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04);

  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
}

[data-theme="dark"] {
  --color-primary: #2DD4BF;
  --color-primary-hover: #5EEAD4;
  --color-primary-pressed: #14B8A6;
  --color-primary-surface: #115E59;

  --color-bg: #0F172A;
  --color-surface: #1E293B;
  --color-surface-elevated: #334155;
  --color-border: #475569;
  --color-text-primary: #F1F5F9;
  --color-text-secondary: #94A3B8;
  --color-text-muted: #64748B;

  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.3);
}
```

### 10.2 Ant Design Theme Integration

Map design tokens to Ant Design's `ConfigProvider`:

```tsx
<ConfigProvider
  theme={{
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#0D9488',
      colorSuccess: '#10B981',
      colorWarning: '#F59E0B',
      colorError: '#EF4444',
      colorInfo: '#3B82F6',
      colorBgContainer: isDark ? '#1E293B' : '#FFFFFF',
      colorBgLayout: isDark ? '#0F172A' : '#F8FAFC',
      colorText: isDark ? '#F1F5F9' : '#334155',
      colorTextSecondary: isDark ? '#94A3B8' : '#64748B',
      colorBorder: isDark ? '#475569' : '#E2E8F0',
      borderRadius: 8,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      fontSize: 15,
    },
  }}
>
```

### 10.3 Styled Components Theme

Pass the same tokens through Styled Components' ThemeProvider so they're accessible
in all styled components via `props.theme.*`:

```tsx
const lightTheme = {
  colors: {
    primary: '#0D9488',
    primaryHover: '#14B8A6',
    bg: '#F8FAFC',
    surface: '#FFFFFF',
    border: '#E2E8F0',
    textPrimary: '#334155',
    textSecondary: '#64748B',
    // ... etc
  },
  spacing: { /* ... */ },
  radii: { /* ... */ },
  shadows: { /* ... */ },
};

// Usage in styled-components:
const Card = styled.div`
  background: ${(p) => p.theme.colors.surface};
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.md};
  box-shadow: ${(p) => p.theme.shadows.sm};
`;
```

### 10.4 Migration Path from Current Styles

| Current | Replace with |
|---------|-------------|
| `#00b96b` (green) | `#0D9488` (Teal 600) |
| `#f6ffed` (light green bg) | `#F0FDFA` (Teal 50) or `#F8FAFC` (Slate 50) |
| `#222` (text) | `#334155` (Slate 700) |
| `#555`, `#777` (secondary text) | `#64748B` (Slate 500) |
| `#f44336` (error red) | `#EF4444` (Red 500) |
| `#cecece` (borders) | `#E2E8F0` (Slate 200) |
| `border-radius: 4px` everywhere | 8px cards, 12px bubbles, 4px inputs |
| Heavy box-shadow on chat cards | `shadow-sm` at rest |
| `antiquewhite` border | `#E2E8F0` (Slate 200) |
