---
name: renata-ui
description: >-
  Renata UI design system — colors, typography, component patterns, layout
  conventions, and visual identity. Use when creating or modifying UI components,
  pages, or styles to maintain visual consistency across the app.
---

# Renata — UI & Design System

## Visual Identity

Dark-mode-only application with amber/gold accents. Minimal, modern, slightly editorial feel thanks to the serif heading font.

## Colors

All colors defined as CSS custom properties in `app/globals.css` using OKLCH.

### Key Surfaces

| Token | Light | Dark (active) | Usage |
|-------|-------|---------------|-------|
| `--background` | `oklch(1 0 0)` | `oklch(0.145 0 0)` / `#0d1117` | Page background |
| `--card` | white | `oklch(0.205 0 0)` / `#161b22` | Cards, panels, inputs |
| `--popover` | white | `oklch(0.205 0 0)` | Dropdown menus, modals |
| `--border` | `oklch(0.922)` | `oklch(1 0 0 / 10%)` / `white/10` | Borders, separators |
| `--input` | `oklch(0.922)` | `oklch(1 0 0 / 15%)` / `white/15` | Input borders |

### Brand Accent (Amber)

Used via Tailwind utilities, not CSS variables:

| Class | Usage |
|-------|-------|
| `bg-amber-600` | Primary buttons (CTA) |
| `hover:bg-amber-500` | Button hover state |
| `bg-amber-600/20` | User chat bubbles |
| `text-amber-100` | User message text |
| `text-amber-500` | Feature icons, loading dots, accents |
| `bg-amber-500/10` | Selected model card, stat icon backgrounds |
| `border-amber-500/30` | Card hover state, expanded section borders |
| `border-amber-500/50` | Selected model card border, input focus |

### Text Hierarchy

| Class | Usage |
|-------|-------|
| `text-neutral-100` | Headings, primary text, names |
| `text-neutral-200` | Strong/bold in prose, secondary headings |
| `text-neutral-300` | Body text, assistant message content |
| `text-neutral-400` | Descriptions, meta info, ghost buttons |
| `text-neutral-500` | Timestamps, placeholder text, subtle labels |
| `text-neutral-600` | Very subtle text (e.g. "Powered by X") |

### Status Colors

| Color | Usage |
|-------|-------|
| `bg-green-500/20 text-green-400` | Complete status badge |
| `bg-red-500/10 text-red-400` | Error banners, rate limit messages |
| `bg-blue-500/10 text-blue-400` | Token stats icon |
| `bg-purple-500/10 text-purple-400` | Request stats icon |

## Typography

Defined in `app/layout.tsx`:

| Variable | Font | Usage |
|----------|------|-------|
| `--font-geist-sans` | Geist | Body text, UI elements (`font-sans`) |
| `--font-geist-mono` | Geist Mono | Code, monospace contexts |
| `--font-serif` | EB Garamond | Headings — page titles, session titles, nav brand, modal headers |

### Heading Pattern

```tsx
<h1 className="font-serif text-3xl text-neutral-100">Page Title</h1>
<p className="mt-1 text-sm text-neutral-400">Supporting description.</p>
```

## Layout Patterns

### Page Backgrounds

- Always `bg-[#0d1117]` (the dark background hex, matching `--background` in dark mode)
- Chat page: full-screen flex column (`h-screen flex flex-col`)
- Dashboard: content within a layout wrapper

### Content Width

- Chat messages: `max-w-3xl mx-auto`
- Marketing: `max-w-5xl mx-auto`
- Dashboard cards: responsive grid `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`

### Cards

```tsx
<Card className="border-white/10 bg-[#161b22] transition-colors hover:border-amber-500/30">
```

### Modals

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
  <div className="mx-4 w-full max-w-lg rounded-xl border border-white/10 bg-[#161b22] p-6 shadow-2xl">
```

## Component Library

- **shadcn/ui** (v4) — Button, Card, Badge, Table, ScrollArea, DropdownMenu, Input, Textarea, Separator, Avatar
- **Lucide React** — all icons
- **@base-ui/react** — used for select/primitive components
- **class-variance-authority + clsx + tailwind-merge** — for variant composition (`cn()` utility in `lib/utils.ts`)

## Chat Interface Patterns

### Message Bubbles

```
User:      bg-amber-600/20 text-amber-100, right-aligned
Assistant: bg-white/5 text-neutral-300, left-aligned, with avatar
```

### Assistant Avatar

```tsx
<img src="/renata-avatar.png" alt="Renata" className="mr-2.5 mt-1 h-7 w-7 flex-shrink-0 rounded-full" />
```

### Typing Indicator

Three amber pulsing dots:
```tsx
<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
```

### Markdown Rendering

Assistant messages use `react-markdown` with `remark-gfm` and extensive prose styling:
```
prose prose-invert prose-sm max-w-none
prose-headings:text-neutral-100 prose-headings:font-semibold
prose-a:text-amber-400
prose-strong:text-neutral-200
prose-p:text-neutral-300 prose-li:text-neutral-300
```

## Buttons

| Variant | Classes | Usage |
|---------|---------|-------|
| Primary CTA | `bg-amber-600 text-white hover:bg-amber-500` | New session, Start session, Send, Donate |
| Ghost | `variant="ghost" text-neutral-400 hover:text-white` | Back, Upload, Export |
| Ghost small | Same + `size="sm"` | Header actions |

## Badges

| State | Classes |
|-------|---------|
| Premium tier | `bg-amber-500/20 text-amber-400` |
| Basic tier | `bg-neutral-500/20 text-neutral-400` |
| Complete | `bg-green-500/20 text-green-400` |
| In progress | `bg-neutral-500/20 text-neutral-400` |
| Admin role | `bg-amber-500/20 text-amber-400` |

## Loading States

- Full page: `<Loader2 className="h-8 w-8 animate-spin text-amber-500" />`
- Inline spinner: `h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent`
- Button loading: replace icon with `<Loader2 className="h-5 w-5 animate-spin" />`

## Empty States

```tsx
<div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/10 py-20 text-center">
  <Icon className="mb-4 h-10 w-10 text-neutral-600" />
  <p className="text-neutral-400">Primary message</p>
  <p className="mt-1 text-sm text-neutral-500">Secondary message.</p>
</div>
```

## Error Banners

```tsx
<div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
  <AlertCircle className="h-4 w-4 flex-shrink-0" />
  {errorMessage}
</div>
```

## Nav

Fixed top nav with backdrop blur:
```tsx
<nav className="fixed top-0 z-50 w-full border-b border-white/10 bg-[#0d1117]/80 backdrop-blur-md">
```
Brand name rendered in serif: `font-serif text-xl text-neutral-100`
