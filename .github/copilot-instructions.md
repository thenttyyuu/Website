# Copilot instructions for this repository

## Build, test, and lint commands

This repository is a static site with no package manager manifest and no configured build, test, or lint tooling.

- **Build:** none configured
- **Test:** none configured (no test runner or test files)
- **Lint:** none configured
- **Single-test command:** not available (no test framework configured)

Deployment is handled by GitHub Actions: `.github/workflows/deploy.yaml` publishes the repository root to GitHub Pages on pushes to `master`.

## High-level architecture

- The app is a **single static page** (`index.html`) styled by `style.css` and behavior-driven by `main.js`.
- `index.html` is organized into anchored sections (`#intro`, `#about`, `#interests`, `#projects`, `#experience`, `#contact`) linked by the fixed top nav.
- `style.css` contains:
  - global theme tokens and fluid sizing in `:root` custom properties
  - section/card layout systems (`.panel`, `.info-grid`, `.feature-card`, responsive breakpoints)
  - animation keyframes and visual components for interest/project cards
- `main.js` is an IIFE that initializes independent UI modules:
  - divider ticker generation/animation for each `.divider`
  - cursor-reactive CSS variable updates and tesseract tilt
  - mobile menu toggle (`body.menu-open`)
  - async contact form submission to Formspree (`#contactForm`)
  - hover-triggered interest animations (`data-effect` contract + `.playing` class)
  - mini fly canvas game (`#miniFlyCanvas`)
  - one-time theme accent randomization (`window.programLoaded`)

## Key conventions

- **HTML/CSS/JS selector contracts are strict.** JS relies on specific IDs/classes (`#mobileMenuToggle`, `#mainNavLinks`, `#contactForm`, `#contactFormStatus`, `.divider`, `.interest-card[data-effect]`, `#miniFlyCanvas`). Renaming requires coordinated updates across files.
- **Interest-card animation wiring uses `data-effect` keys.** Keys in HTML must match:
  1. `effectDurations` keys in `main.js`
  2. CSS selectors like `.interest-card[data-effect="..."].playing ...`
  3. CSS custom properties populated by `syncEffectMetrics()`
- **Animation sizing is CSS-variable driven at runtime.** `main.js` computes travel distances from each `.interest-visual` width and writes custom properties (for example `--tennis-travel`, `--robot-travel`, `--pong-travel`). Keep this pattern when adding or changing motion paths.
- **Dividers are data-driven from inline text nodes.** Each `.divider` starts with a `<span data-text="...">`; JS removes it, builds `.divider-track` + repeated `.divider-item`s, and animates left/right by divider index.
- **Responsive behavior is centralized in CSS breakpoints.** Layout changes are handled at `max-width: 900px`, `760px`, and `520px`; JS only handles state toggles (for example, mobile menu open/close) and metric recalculation on resize.
