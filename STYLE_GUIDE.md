# Oneshot Brand Style Guide

## Brand Essence

**Oneshot** is a platform for verified AI code transformations. The visual identity balances:
- **Clean minimalism** (Product Hunt influence) - Generous whitespace, clear hierarchy
- **Retro web authenticity** (Hacker News influence) - Information density, functional simplicity
- **Gallery-quality polish** (Dribbble influence) - Visual refinement, content-first presentation

---

## Color Palette

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Background** | `#0d0d0d` | Page background, depth |
| **Surface** | `#141414` | Cards, elevated elements |
| **Surface Elevated** | `#1a1a1a` | Hover states, inputs |
| **Border** | `#262626` | Dividers, card borders |
| **Border Subtle** | `#1f1f1f` | Subtle separations |

### Text Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Text Primary** | `#fafafa` | Headlines, important text |
| **Text Secondary** | `#a1a1a1` | Body text, descriptions |
| **Text Muted** | `#737373` | Metadata, timestamps |
| **Text Disabled** | `#525252` | Inactive states |

### Accent Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Accent** | `#f97316` | Primary actions, links, highlights |
| **Accent Hover** | `#fb923c` | Hover states |
| **Accent Muted** | `rgba(249, 115, 22, 0.15)` | Backgrounds, badges |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Success** | `#22c55e` | Additions, positive states |
| **Success Muted** | `rgba(34, 197, 94, 0.15)` | Diff additions |
| **Error** | `#ef4444` | Deletions, errors |
| **Error Muted** | `rgba(239, 68, 68, 0.15)` | Diff deletions |
| **Warning** | `#eab308` | Warnings, stars |

---

## Typography

### Font Stack

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', monospace;
```

### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| **Display** | 2.5rem (40px) | 700 | 1.1 | Hero headlines |
| **H1** | 1.75rem (28px) | 600 | 1.2 | Page titles |
| **H2** | 1.25rem (20px) | 600 | 1.3 | Section headers, card titles |
| **H3** | 1rem (16px) | 600 | 1.4 | Subsections |
| **Body** | 0.9375rem (15px) | 400 | 1.6 | Primary content |
| **Small** | 0.8125rem (13px) | 400 | 1.5 | Metadata, captions |
| **Tiny** | 0.75rem (12px) | 500 | 1.4 | Badges, labels |

### Typography Rules

- Headlines use **-0.02em letter-spacing** for tightness
- Body text uses **default letter-spacing** for readability
- Uppercase labels use **0.05em letter-spacing** for clarity
- Monospace code uses **0.875rem** base size

---

## Spacing System

Base unit: **4px**

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Tight gaps |
| `--space-2` | 8px | Related elements |
| `--space-3` | 12px | Component padding |
| `--space-4` | 16px | Card padding, gaps |
| `--space-5` | 20px | Section spacing |
| `--space-6` | 24px | Large gaps |
| `--space-8` | 32px | Section margins |
| `--space-10` | 40px | Page sections |
| `--space-12` | 48px | Major divisions |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Badges, small elements |
| `--radius-md` | 6px | Buttons, inputs |
| `--radius-lg` | 8px | Cards, containers |
| `--radius-xl` | 12px | Modals, large cards |
| `--radius-full` | 9999px | Avatars, pills |

---

## Components

### Cards

```
- Background: var(--surface)
- Border: 1px solid var(--border)
- Border Radius: var(--radius-lg)
- Padding: var(--space-5)
- Hover: border-color transitions to var(--accent)
- Shadow: none (flat design)
```

**Card Hierarchy:**
1. **Featured Card** - Larger padding, accent border-top
2. **Standard Card** - Default styling
3. **Compact Card** - Reduced padding for dense listings

### Buttons

**Primary Button:**
```
- Background: var(--accent)
- Color: white
- Padding: 10px 16px
- Border Radius: var(--radius-md)
- Font Weight: 500
- Hover: background lightens 10%
```

**Secondary Button:**
```
- Background: transparent
- Border: 1px solid var(--border)
- Color: var(--text-secondary)
- Hover: border-color var(--accent), color var(--accent)
```

**Ghost Button:**
```
- Background: transparent
- Color: var(--text-muted)
- Hover: color var(--text-primary)
```

### Badges/Tags

```
- Background: var(--surface-elevated)
- Color: var(--text-secondary)
- Padding: 4px 8px
- Border Radius: var(--radius-sm)
- Font Size: var(--text-tiny)
- Font Weight: 500
```

**Badge Variants:**
- **Default** - Neutral background
- **Accent** - var(--accent-muted) background, var(--accent) text
- **Success** - Green for additions
- **Error** - Red for deletions

### Links

```
- Color: var(--accent)
- Text Decoration: none
- Hover: underline or color lightens
```

**Link Types:**
- **Inline Link** - Accent color, underline on hover
- **Navigation Link** - Muted color, accent on hover
- **Card Link** - Entire card clickable, subtle hover state

### Form Inputs

```
- Background: var(--bg)
- Border: 1px solid var(--border)
- Color: var(--text-primary)
- Padding: 10px 12px
- Border Radius: var(--radius-md)
- Focus: border-color var(--accent), subtle glow
```

---

## Layout

### Container Widths

| Name | Width | Usage |
|------|-------|-------|
| **Narrow** | 640px | Forms, focused content |
| **Default** | 900px | Shot detail pages |
| **Wide** | 1200px | Gallery, dashboards |
| **Full** | 100% | Edge-to-edge sections |

### Grid System

Gallery uses CSS Grid:
```css
grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
gap: var(--space-5);
```

### Header

```
- Height: 60px
- Background: var(--bg) with subtle border-bottom
- Logo: Left-aligned, 1.25rem, font-weight 700
- Navigation: Right-aligned, var(--space-6) gaps
- Sticky positioning
```

---

## Iconography

- Style: Outlined, 1.5px stroke
- Size: 16px (small), 20px (default), 24px (large)
- Color: Inherits text color
- Preferred set: Lucide Icons or Heroicons

---

## Motion & Animation

### Transitions

```css
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;
```

### Animation Principles

- **Subtle** - Micro-interactions only, no flashy effects
- **Purposeful** - Animation indicates state change
- **Quick** - Under 300ms for UI feedback
- **Reduced motion** - Respect prefers-reduced-motion

### Common Animations

- **Hover lift** - transform: translateY(-2px) on cards
- **Color transitions** - border-color, background-color
- **Fade in** - opacity 0 to 1 for lazy-loaded content

---

## Code & Diff Display

### Code Blocks

```
- Background: #111111
- Border Radius: var(--radius-md)
- Padding: var(--space-4)
- Font: var(--font-mono)
- Font Size: 0.8125rem
- Line Height: 1.6
- Overflow: auto with custom scrollbar
```

### Diff Styling

```
- Addition: color #4ade80, bg rgba(74, 222, 128, 0.1)
- Deletion: color #f87171, bg rgba(248, 113, 113, 0.1)
- Line numbers: color var(--text-muted)
- File headers: font-weight 600, border-bottom
```

---

## Voice & Tone

### Brand Voice

- **Direct** - Say what you mean, no fluff
- **Technical** - Speak to developers authentically
- **Confident** - Verified transformations, proven results
- **Welcoming** - Open source spirit, community-driven

### Writing Guidelines

- Use active voice
- Keep sentences short
- Avoid jargon unless necessary
- Be specific with numbers and data
- Headlines: Title case for major, sentence case for minor

---

## Logo Usage

### Primary Logo

- **Wordmark:** "Oneshot" in Inter Bold
- **Lockup:** Optional crosshair/target icon + wordmark
- **Minimum size:** 80px width
- **Clear space:** 1x height on all sides

### Color Variations

- **Light on dark:** White wordmark on dark backgrounds
- **Dark on light:** Black wordmark on light backgrounds
- **Accent:** Orange wordmark for special uses

---

## Social & Marketing

### Open Graph Images

- Size: 1200x630px
- Background: var(--bg) or gradient
- Featured content: Screenshot thumbnail
- Text: Shot title, author, Oneshot branding

### Twitter Cards

- Large image summary format
- Include preview screenshot when available
- Consistent branding bottom-right

---

## Accessibility

- **Contrast:** Minimum 4.5:1 for text, 3:1 for large text
- **Focus states:** Visible outline on all interactive elements
- **Alt text:** Required for all images
- **Keyboard navigation:** Full support
- **Screen readers:** Semantic HTML, ARIA labels

---

## Implementation Checklist

- [ ] Update CSS custom properties
- [ ] Apply typography scale
- [ ] Restyle header and navigation
- [ ] Restyle shot cards in gallery
- [ ] Restyle shot detail page
- [ ] Restyle forms and inputs
- [ ] Add hover states and transitions
- [ ] Update badges and tags
- [ ] Polish code/diff display
- [ ] Add focus states for accessibility
